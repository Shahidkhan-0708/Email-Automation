import { getSupabaseClient } from './client.js';
import { logger } from '../utils/logger.js';

export async function savePersonalization(data) {
  const supabase = getSupabaseClient();
  const { data: row, error } = await supabase
    .from('personalization_results')
    .insert({
      profile_id: data.profileId,
      campaign_id: data.campaignId,
      subject: data.subject,
      body: data.body,
      evidence_used: data.evidenceUsed || [],
      ai_model: data.aiModel,
      generation_prompt: data.generationPrompt,
      status: data.status || 'pending_review',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    logger.error('Error saving personalization:', { profileId: data.profileId, error: error.message });
    throw error;
  }
  return row;
}

export async function getPersonalization(id) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('personalization_results')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    logger.error(`Error getting personalization ${id}:`, { error: error.message });
    throw error;
  }
  return data;
}

export async function getPersonalizationByProfileAndCampaign(profileId, campaignId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('personalization_results')
    .select('*')
    .eq('profile_id', profileId)
    .eq('campaign_id', campaignId)
    .maybeSingle();

  if (error) {
    logger.error('Error getting personalization by profile/campaign:', { profileId, campaignId, error: error.message });
    throw error;
  }
  return data;
}

export async function listPersonalizations({ status, campaignId, limit = 50, offset = 0 } = {}) {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('personalization_results')
    .select('*, profiles(*)');

  if (status) query = query.eq('status', status);
  if (campaignId) query = query.eq('campaign_id', campaignId);

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.error('Error listing personalizations:', { status, campaignId, error: error.message });
    throw error;
  }
  return data || [];
}

export async function updatePersonalizationStatus(id, fields) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('personalization_results')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error(`Error updating personalization status ${id}:`, { error: error.message });
    throw error;
  }
  return data;
}

export async function addReviewDecision({ personalizationId, decision, comments, editedSubject, editedBody, decidedBy }) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('review_decisions')
    .insert({
      personalization_id: personalizationId,
      decision,
      comments: comments || null,
      edited_subject: editedSubject || null,
      edited_body: editedBody || null,
      decided_by: decidedBy || null,
      decided_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    logger.error(`Error adding review decision for ${personalizationId}:`, { error: error.message });
    throw error;
  }
  return data;
}

export async function getReviewDecisions(personalizationId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('review_decisions')
    .select('*')
    .eq('personalization_id', personalizationId)
    .order('decided_at', { ascending: false });

  if (error) {
    logger.error(`Error getting review decisions for ${personalizationId}:`, { error: error.message });
    throw error;
  }
  return data || [];
}

/**
 * Returns profiles that are ready for personalization generation:
 * - have at least one enrichment result
 * - do not already have a personalization row for the campaign
 */
export async function getProfilesReadyForPersonalization(campaignId, limit = 20) {
  const supabase = getSupabaseClient();

  // 1. profile_ids that already have a personalization for this campaign
  const { data: existing, error: existingErr } = await supabase
    .from('personalization_results')
    .select('profile_id')
    .eq('campaign_id', campaignId);

  if (existingErr) {
    logger.error('Error loading existing personalizations:', { error: existingErr.message });
    throw existingErr;
  }

  const excluded = new Set((existing || []).map(r => r.profile_id));

  // 2. profiles with enrichment results
  const { data: profiles, error: profilesErr } = await supabase
    .from('profiles')
    .select('*, enrichment_results(*)');

  if (profilesErr) {
    logger.error('Error loading profiles for personalization:', { error: profilesErr.message });
    throw profilesErr;
  }

  return (profiles || [])
    .filter(p => (p.enrichment_results || []).length > 0 && !excluded.has(p.id))
    .slice(0, limit);
}

export async function getBulkStats(campaignId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('personalization_results')
    .select('status')
    .eq('campaign_id', campaignId);

  if (error) {
    logger.error('Error getting bulk stats:', { campaignId, error: error.message });
    throw error;
  }

  const stats = { total: 0, pending_review: 0, approved: 0, rejected: 0, edited: 0 };
  for (const row of data || []) {
    stats.total += 1;
    if (row.status in stats) stats[row.status] += 1;
  }
  return stats;
}
