import OpenAI from 'openai';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { getSupabaseClient } from '../db/client.js';
import { getProfile } from '../db/profiles.js';
import { getEnrichmentResults } from '../db/enrichment.js';
import { getOrCreateDefaultCampaign } from '../db/campaigns.js';
import {
  savePersonalization,
  getPersonalization,
  getPersonalizationByProfileAndCampaign,
  listPersonalizations,
  updatePersonalizationStatus,
  addReviewDecision,
  getReviewDecisions,
  getProfilesReadyForPersonalization,
  getBulkStats,
} from '../db/personalization.js';
import { linkPersonalizationToOutreach } from '../db/outreach.js';
import { approveContactPersonalization } from '../db/contacts.js';

const VALID_DECISIONS = ['approved', 'rejected', 'edited'];

// ------------------------------------------------------------
// Generation
// ------------------------------------------------------------

export async function generatePersonalizedEmail(profileId, campaignId) {
  const [profile, enrichments, campaign] = await Promise.all([
    getProfile(profileId),
    getEnrichmentResults(profileId),
    campaignId ? getCampaign(campaignId) : getOrCreateDefaultCampaign(),
  ]);

  const prompt = buildPrompt(profile, enrichments, campaign, config.smtp);
  const result = await callOpenAI(prompt);

  const personalization = {
    profileId,
    campaignId: campaign.id,
    subject: result.subject || '',
    body: result.body || '',
    evidenceUsed: normalizeEvidence(result.evidencesUsed || result.evidenceUsed || []),
    aiModel: config.ai.model,
    generationPrompt: prompt,
    status: 'pending_review',
  };

  const saved = await savePersonalization(personalization);
  logger.info(`Generated personalization ${saved.id} for profile ${profileId}`);
  return saved;
}

export async function regeneratePersonalization(profileId, campaignId) {
  const campaign = campaignId ? await getCampaign(campaignId) : await getOrCreateDefaultCampaign();
  const existing = await getPersonalizationByProfileAndCampaign(profileId, campaign.id);

  // Remove the old pending row so a fresh one can be created for this profile/campaign.
  // (personalization_results has no unique constraint on profile+campaign, so the
  // "latest" row is what review/send picks up.)
  if (existing && existing.status === 'pending_review') {
    await updatePersonalizationStatus(existing.id, { status: 'rejected' });
    await addReviewDecision({
      personalizationId: existing.id,
      decision: 'rejected',
      comments: 'Superseded by regeneration',
    });
  }

  return generatePersonalizedEmail(profileId, campaign.id);
}

// ------------------------------------------------------------
// Review workflow
// ------------------------------------------------------------

export async function submitReviewDecision(personalizationId, decision, { comments, editedSubject, editedBody, decidedBy } = {}) {
  if (!VALID_DECISIONS.includes(decision)) {
    throw new Error(`Invalid decision '${decision}'. Must be one of: ${VALID_DECISIONS.join(', ')}`);
  }

  const personalization = await getPersonalization(personalizationId);
  if (!personalization) throw new Error(`Personalization ${personalizationId} not found`);

  const updates = { status: decision };

  if (decision === 'approved') {
    updates.approved_at = new Date().toISOString();
    updates.approved_by = decidedBy || null;
    // For 'edited', the operator approves with a modified copy
    if (editedSubject || editedBody) {
      updates.status = 'edited';
      updates.edited_subject = editedSubject || null;
      updates.edited_body = editedBody || null;
    }
  } else if (decision === 'rejected') {
    updates.rejected_at = new Date().toISOString();
    updates.rejected_by = decidedBy || null;
  } else if (decision === 'edited') {
    updates.edited_subject = editedSubject || null;
    updates.edited_body = editedBody || null;
  }

  await updatePersonalizationStatus(personalizationId, updates);
  await addReviewDecision({
    personalizationId,
    decision: updates.status,
    comments,
    editedSubject: editedSubject || null,
    editedBody: editedBody || null,
    decidedBy,
  });

  if (updates.status === 'approved' || updates.status === 'edited') {
    await activateForSending(personalization);
  }

  return getPersonalization(personalizationId);
}

export async function getEvidenceTrace(personalizationId) {
  const personalization = await getPersonalization(personalizationId);
  if (!personalization) throw new Error(`Personalization ${personalizationId} not found`);

  const decisions = await getReviewDecisions(personalizationId);
  return {
    personalization,
    evidenceUsed: Array.isArray(personalization.evidence_used) ? personalization.evidence_used : [],
    trace: buildEvidenceTrace(personalization.evidence_used || []),
    reviewHistory: decisions,
  };
}

// ------------------------------------------------------------
// Bulk processing
// ------------------------------------------------------------

export async function approveAndScheduleBulk({ campaignId, personalizationIds, limit = 50, decidedBy } = {}) {
  const approved = [];
  const skipped = [];

  const pending = personalizationIds && personalizationIds.length > 0
    ? await listPersonalizationsByIds(personalizationIds)
    : await listPersonalizations({ status: 'pending_review', campaignId, limit });

  for (const p of pending.slice(0, limit)) {
    try {
      await submitReviewDecision(p.id, 'approved', { decidedBy });
      approved.push(p.id);
    } catch (err) {
      logger.warn(`Bulk approve skipped personalization ${p.id}:`, { error: err.message });
      skipped.push({ id: p.id, reason: err.message });
    }
  }

  return { approved, skipped, total: pending.length };
}

export async function getProgress(campaignId) {
  const stats = await getBulkStats(campaignId);
  const sent = await getSentCount(campaignId);
  return { ...stats, sent };
}

// ------------------------------------------------------------
// Batch job entry point (called by personalization.job.js)
// ------------------------------------------------------------

export async function processPendingPersonalizations(campaignId, limit = 20) {
  const campaign = campaignId ? await getCampaign(campaignId) : await getOrCreateDefaultCampaign();
  const readyProfiles = await getProfilesReadyForPersonalization(campaign.id, limit);

  const results = { generated: 0, failed: 0, errors: [] };
  for (const profile of readyProfiles) {
    try {
      await generatePersonalizedEmail(profile.id, campaign.id);
      results.generated += 1;
    } catch (err) {
      results.failed += 1;
      results.errors.push({ profileId: profile.id, error: err.message });
      logger.error(`Personalization generation failed for profile ${profile.id}:`, { error: err.message });
    }
  }

  logger.info(`Personalization batch complete. Generated: ${results.generated}, Failed: ${results.failed}`);
  return results;
}

// ------------------------------------------------------------
// Internals
// ------------------------------------------------------------

async function activateForSending(personalization) {
  const profile = await getProfile(personalization.profile_id);
  await linkPersonalizationToOutreach(profile.contact_id, personalization.campaign_id, personalization.id);
  await approveContactPersonalization(profile.contact_id);
}

async function getCampaign(campaignId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`Campaign ${campaignId} not found`);
  return data;
}

async function listPersonalizationsByIds(ids) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('personalization_results')
    .select('*')
    .in('id', ids);
  if (error) throw error;
  return data || [];
}

async function getSentCount(campaignId) {
  const supabase = getSupabaseClient();
  const { count, error } = await supabase
    .from('outreach')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .in('status', ['Sent', 'Follow-up 1', 'Follow-up 2', 'Replied']);
  if (error) {
    logger.error('Error counting sent outreach:', { campaignId, error: error.message });
    return 0;
  }
  return count || 0;
}

export function buildPrompt(profile, enrichments, campaign, senderInfo) {
  const factsForPrompt = (enrichments || [])
    .map(e => {
      const confidencePercent = Math.round((e.confidence || 0) * 100);
      const verified = e.verified ? 'Verified' : 'Unverified';
      return `- ${e.relationship}: "${e.fact_value}" (Source: ${e.source_id || 'Manual'}, Confidence: ${confidencePercent}%, Status: ${verified})`;
    })
    .join('\n');

  const nonEmptyFields = [];
  if (profile.full_name) nonEmptyFields.push(`full_name: "${profile.full_name}"`);
  if (profile.organization) nonEmptyFields.push(`organization: "${profile.organization}"`);
  if (profile.role) nonEmptyFields.push(`role: "${profile.role}"`);
  if (profile.college) nonEmptyFields.push(`college: "${profile.college}"`);

  return `
Persona Profile:
${nonEmptyFields.join('\n') || '(no profile fields provided)'}

Verified Research & Enrichment Facts:
${factsForPrompt || '(no facts provided)'}

Campaign Context:
Campaign Name: ${campaign.name || 'N/A'}
Campaign Description: ${campaign.description || 'N/A'}

Sender Information:
Sender Name: ${senderInfo.fromName}
Sender Email: ${senderInfo.fromEmail}

Objective:
Generate a personalized outreach email that:
1. Uses only facts from the person's profile and enrichment results
2. Incorporates research results with proper source attribution
3. Demonstrates understanding of their specific role, achievements, or expertise
4. Is personalized to their unique background and interests
5. Has a compelling call-to-action

Generation Rules:
- Do NOT invent or hallucinate information that is not in the provided facts
- Reference each fact used by its Source and Confidence so they can be traced back
- Use neutral, respectful, and professional tone
- Address the person by their full name
- Clearly state your objective and what you would like to discuss

Output Format (JSON only):
{
  "subject": "A concise, personalized subject line",
  "body": "The full email body (plain text, with \\n line breaks)",
  "evidencesUsed": [
    { "id": "<fact id>", "source": "<source_id>", "confidence": 0.92, "usage": "<opening hook | credibility argument | call to action>" }
  ]
}
`;
}

export function buildEvidenceTrace(evidenceUsed) {
  if (!Array.isArray(evidenceUsed)) return [];
  return evidenceUsed.map(fact => ({
    factId: fact.id || fact.factId || null,
    source: fact.source || null,
    confidence: fact.confidence != null ? fact.confidence : null,
    usage: fact.usage || null,
  }));
}

function normalizeEvidence(evidence) {
  return evidence.map(f => ({
    id: f.id || f.factId || null,
    source: f.source || null,
    confidence: f.confidence != null ? f.confidence : null,
    usage: f.usage || null,
  }));
}

async function callOpenAI(prompt) {
  if (!config.ai.apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const openai = new OpenAI({ apiKey: config.ai.apiKey });

  try {
    const response = await openai.chat.completions.create({
      model: config.ai.model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    logger.error('OpenAI API call failed', { error: error.message });
    throw new Error('AI personalization generation failed');
  }
}
