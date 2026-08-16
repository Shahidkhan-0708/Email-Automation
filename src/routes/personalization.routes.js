import express from 'express';
import { requireApiKey } from '../middleware/api-key.js';
import { logger } from '../utils/logger.js';
import { getProfile } from '../db/profiles.js';
import { enrichProfile } from '../db/enrichment.js';
import { getOrCreateDefaultCampaign } from '../db/campaigns.js';
import { listPersonalizations } from '../db/personalization.js';
import {
  generatePersonalizedEmail,
  regeneratePersonalization,
  submitReviewDecision,
  getEvidenceTrace,
  approveAndScheduleBulk,
  getProgress,
} from '../services/personalization.service.js';
import { processOutreachBatch } from '../services/outreach.service.js';

export const personalizationRouter = express.Router();

// POST /api/personalization/generate/:profileId - generate an AI personalization for a profile
personalizationRouter.post('/personalization/generate/:profileId', requireApiKey, async (req, res) => {
  try {
    const campaignId = req.body.campaignId || (await getOrCreateDefaultCampaign()).id;
    const personalization = await generatePersonalizedEmail(req.params.profileId, campaignId);
    res.status(201).json({ success: true, personalization });
  } catch (err) {
    logger.error('Error generating personalization:', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/personalization/:personalizationId/evidence - evidence trace for a generated email
personalizationRouter.get('/personalization/:personalizationId/evidence', requireApiKey, async (req, res) => {
  try {
    const trace = await getEvidenceTrace(req.params.personalizationId);
    res.json({ success: true, ...trace });
  } catch (err) {
    res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message });
  }
});

// PUT /api/personalization/regenerate - regenerate (evidence-based recreation)
personalizationRouter.put('/personalization/regenerate', requireApiKey, async (req, res) => {
  try {
    const { profileId, campaignId } = req.body;
    if (!profileId) {
      return res.status(400).json({ error: 'profileId is required' });
    }
    const campaign = campaignId || (await getOrCreateDefaultCampaign()).id;
    const personalization = await regeneratePersonalization(profileId, campaign);
    res.json({ success: true, personalization });
  } catch (err) {
    logger.error('Error regenerating personalization:', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/review/queue - pending personalizations awaiting review
personalizationRouter.get('/review/queue', requireApiKey, async (req, res) => {
  try {
    const { campaignId, limit } = req.query;
    const items = await listPersonalizations({
      status: 'pending_review',
      campaignId: campaignId || undefined,
      limit: parseInt(limit, 10) || 50,
    });
    res.json({ success: true, queue: items });
  } catch (err) {
    logger.error('Error loading review queue:', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// POST /api/review/:personalizationId - submit an approve/reject/edit decision
personalizationRouter.post('/review/:personalizationId', requireApiKey, async (req, res) => {
  try {
    const { decision, comments, editedSubject, editedBody, decidedBy } = req.body;
    const personalization = await submitReviewDecision(req.params.personalizationId, decision, {
      comments,
      editedSubject,
      editedBody,
      decidedBy,
    });
    res.json({ success: true, personalization });
  } catch (err) {
    const status = err.message.startsWith('Invalid decision') ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});

// POST /api/bulk/approve-and-send - approve pending personalizations and trigger the send
personalizationRouter.post('/bulk/approve-and-send', requireApiKey, async (req, res) => {
  try {
    const { campaignId, personalizationIds, limit, decidedBy } = req.body;
    const approval = await approveAndScheduleBulk({ campaignId, personalizationIds, limit, decidedBy });

    let sendResult = null;
    try {
      sendResult = await processOutreachBatch();
    } catch (err) {
      logger.error('Bulk send failed after approval:', { error: err.message });
    }

    res.json({ success: true, approval, sendResult });
  } catch (err) {
    logger.error('Error in bulk approve-and-send:', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bulk/progress - progress of approved/sent/pending for a campaign
personalizationRouter.get('/bulk/progress', requireApiKey, async (req, res) => {
  try {
    const campaignId = req.query.campaignId || (await getOrCreateDefaultCampaign()).id;
    const progress = await getProgress(campaignId);
    res.json({ success: true, progress });
  } catch (err) {
    logger.error('Error getting bulk progress:', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// POST /api/enrichment/:profileId/run - run enrichment for a profile against enabled sources
personalizationRouter.post('/enrichment/:profileId/run', requireApiKey, async (req, res) => {
  try {
    await getProfile(req.params.profileId);
    const results = await enrichProfile(req.params.profileId);
    res.json({ success: true, results });
  } catch (err) {
    logger.error('Error running enrichment:', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});
