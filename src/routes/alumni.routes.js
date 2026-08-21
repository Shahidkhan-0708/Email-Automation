import { Router } from 'express';
import { requireAuth } from '../middleware/supabase-auth.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';
import { searchLinkedInBySchool } from '../services/linkedin.service.js';
import { createOrUpdateContact } from '../db/contacts.js';
import { createOrUpdateProfile } from '../db/profiles.js';
import { getOrCreateDefaultCampaign } from '../db/campaigns.js';
import { getSupabaseClient } from '../db/client.js';
import { queueResearchBatch } from '../services/research.service.js';

export const alumniRouter = Router();

// -----------------------------------------------------------------------
// POST /api/alumni/discover
//
// Discover alumni of a school/college via LinkedIn People Search.
// Returns a list of candidate profiles (not yet imported).
//
// Body: { school: string, maxResults?: number, location?: string }
// -----------------------------------------------------------------------
alumniRouter.post('/alumni/discover', requireAuth, async (req, res) => {
  try {
    const { school, maxResults = 10, location } = req.body;

    if (!school || typeof school !== 'string' || school.trim().length === 0) {
      return res.status(400).json({ error: 'school is required (e.g. "MIT" or "Madanapalle Institute of Technology")' });
    }

    if (!config.apify?.token) {
      return res.status(400).json({
        error: 'Apify token not configured. Set APIFY_TOKEN in .env to enable LinkedIn discovery.',
      });
    }

    const limit = Math.min(Math.max(1, parseInt(maxResults, 10) || 10), 50);
    logger.info(`Alumni discovery: searching for "${school}" (max ${limit})`);

    const candidates = await searchLinkedInBySchool(school.trim(), {
      maxResults: limit,
      location: location || undefined,
    });

    logger.info(`Alumni discovery: found ${candidates.length} candidates for "${school}"`);

    res.json({
      success: true,
      school: school.trim(),
      candidates,
      count: candidates.length,
    });
  } catch (err) {
    logger.error('Alumni discovery failed:', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------
// POST /api/alumni/import
//
// Import discovered alumni candidates into the system as contacts + profiles.
// Optionally triggers the research pipeline on each imported profile.
//
// Body: {
//   school: string,
//   candidates: Array<{ linkedinUrl, firstName, lastName, headline, location, currentCompany }>,
//   runResearch?: boolean  (default: true)
// }
// -----------------------------------------------------------------------
alumniRouter.post('/alumni/import', requireAuth, async (req, res) => {
  try {
    const { school, candidates, runResearch = true } = req.body;

    if (!school || typeof school !== 'string') {
      return res.status(400).json({ error: 'school is required' });
    }
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return res.status(400).json({ error: 'candidates array is required and must not be empty' });
    }
    if (candidates.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 candidates per import. Use multiple batches for larger sets.' });
    }

    const campaign = await getOrCreateDefaultCampaign();
    const supabase = getSupabaseClient();
    const results = { created: 0, skipped: 0, errors: [] };
    const importedProfileIds = [];

    for (const c of candidates) {
      try {
        const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Unknown';
        const email = c.linkedinUrl
          ? `linkedin-${(c.profileId || c.linkedinUrl).replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)}@placeholder.edu`
          : null;

        if (!email) {
          results.skipped++;
          continue;
        }

        // Check for existing contact by email
        const { data: existing } = await supabase
          .from('contacts')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (existing) {
          results.skipped++;
          continue;
        }

        // Create contact
        const contact = await createOrUpdateContact({
          name,
          email,
          organization: c.currentCompany || school,
          role: c.headline || 'Alumni',
        });

        // Create profile
        const profile = await createOrUpdateProfile({
          contact_id: contact.id,
          full_name: name,
          organization: school,
          role: c.headline || 'Alumni',
          linkedin_url: c.linkedinUrl || null,
        });

        // Create outreach enrollment
        const { error: outreachErr } = await supabase
          .from('outreach')
          .upsert({
            contact_id: contact.id,
            campaign_id: campaign.id,
            status: 'Ready',
            sequence_step: 0,
            delivery_status: 'Pending',
          }, { onConflict: 'contact_id,campaign_id' });

        if (outreachErr) {
          logger.warn(`Could not create outreach for ${name}:`, { error: outreachErr.message });
        }

        results.created++;
        importedProfileIds.push(profile.id);
      } catch (err) {
        results.errors.push({ candidate: c.linkedinUrl || 'unknown', error: err.message });
      }
    }

    // Optionally kick off the research pipeline for all imported profiles
    let researchInfo = null;
    if (runResearch && importedProfileIds.length > 0) {
      try {
        researchInfo = queueResearchBatch(importedProfileIds);
        logger.info(`Alumni import: queued research for ${researchInfo.queued} profiles`);
      } catch (err) {
        logger.warn('Alumni import: failed to queue research:', { error: err.message });
      }
    }

    logger.info(`Alumni import: school="${school}", created=${results.created}, skipped=${results.skipped}, errors=${results.errors.length}`);

    res.json({
      success: true,
      school,
      ...results,
      research: researchInfo,
    });
  } catch (err) {
    logger.error('Alumni import failed:', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});
