import express from 'express';
import { requireApiKey } from '../middleware/api-key.js';
import { logger } from '../utils/logger.js';
import { getSupabaseClient } from '../db/client.js';
import { config } from '../config/env.js';

export const dashboardRouter = express.Router();

function fail(res, err, label) {
  logger.error(`${label}:`, { error: err.message });
  res.status(500).json({ error: err.message });
}

// GET /api/campaigns — campaigns with per-campaign outreach counts
dashboardRouter.get('/campaigns', requireApiKey, async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const { data: outreach, error: oErr } = await supabase
      .from('outreach')
      .select('campaign_id, status, ai_category');

    if (oErr) throw oErr;

    const byCampaign = new Map();
    for (const row of outreach || []) {
      const entry = byCampaign.get(row.campaign_id) || { total: 0, sent: 0, replied: 0, active: 0 };
      entry.total += 1;
      if (['Sent', 'Delivered', 'Follow-up 1', 'Follow-up 2', 'Replied', 'Closed'].includes(row.status)) entry.sent += 1;
      if (row.status === 'Replied' || (row.ai_category && row.ai_category !== 'OTHER')) entry.replied += 1;
      if (['Ready', 'Claimed', 'Sending', 'Sent', 'Follow-up 1', 'Follow-up 2'].includes(row.status)) entry.active += 1;
      byCampaign.set(row.campaign_id, entry);
    }

    res.json({
      success: true,
      campaigns: (campaigns || []).map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        status: c.status,
        senderEmail: c.sender_email,
        senderName: c.sender_name,
        createdAt: c.created_at,
        ...(byCampaign.get(c.id) || { total: 0, sent: 0, replied: 0, active: 0 }),
      })),
    });
  } catch (err) {
    fail(res, err, 'Error listing campaigns');
  }
});

// GET /api/contacts — contacts with their latest outreach status
dashboardRouter.get('/contacts', requireApiKey, async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const offset = parseInt(req.query.offset, 10) || 0;

    let query = supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const search = (req.query.search || '').toString().trim();
    if (search) {
      query = supabase
        .from('contacts')
        .select('*')
        .or(`name.ilike.%${search}%,email.ilike.%${search}%,organization.ilike.%${search}%`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
    }

    const { data, error } = await query;
    if (error) throw error;

    const ids = (data || []).map(c => c.id);
    let statusMap = new Map();
    if (ids.length > 0) {
      const { data: outreach, error: oErr } = await supabase
        .from('outreach')
        .select('contact_id, status, campaign_id, sent_at, reply_received_at')
        .in('contact_id', ids);
      if (oErr) throw oErr;
      for (const row of outreach || []) {
        if (!statusMap.has(row.contact_id)) statusMap.set(row.contact_id, []);
        statusMap.get(row.contact_id).push(row);
      }
    }

    res.json({
      success: true,
      contacts: (data || []).map(c => ({
        id: c.id,
        email: c.email,
        name: c.name,
        organization: c.organization,
        role: c.role,
        personalization: c.personalization,
        personalizationApproved: c.personalization_approved,
        suppressed: c.suppressed,
        createdAt: c.created_at,
        outreach: statusMap.get(c.id) || [],
      })),
    });
  } catch (err) {
    fail(res, err, 'Error listing contacts');
  }
});

// GET /api/outreach — outreach records joined with contact + campaign
dashboardRouter.get('/outreach', requireApiKey, async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const offset = parseInt(req.query.offset, 10) || 0;

    let query = supabase
      .from('outreach')
      .select('*, contacts(*), campaigns(*)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const status = (req.query.status || '').toString().trim();
    if (status) query = supabase
      .from('outreach')
      .select('*, contacts(*), campaigns(*)')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const campaignId = (req.query.campaignId || '').toString().trim();
    if (campaignId) query = supabase
      .from('outreach')
      .select('*, contacts(*), campaigns(*)')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, outreach: data || [] });
  } catch (err) {
    fail(res, err, 'Error listing outreach');
  }
});

// GET /api/replies — outreach records with inbound replies
dashboardRouter.get('/replies', requireApiKey, async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);

    const { data, error } = await supabase
      .from('outreach')
      .select('*, contacts(*), campaigns(*)')
      .not('reply_received_at', 'is', null)
      .order('reply_received_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    res.json({ success: true, replies: data || [] });
  } catch (err) {
    fail(res, err, 'Error listing replies');
  }
});

// GET /api/dashboard/stats — aggregate KPIs for the dashboard
dashboardRouter.get('/dashboard/stats', requireApiKey, async (req, res) => {
  try {
    const supabase = getSupabaseClient();

    const { count: contacts, error: cErr } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true });
    if (cErr) throw cErr;

    const { count: campaignCount, error: camErr } = await supabase
      .from('campaigns')
      .select('id', { count: 'exact', head: true });
    if (camErr) throw camErr;

    const { data: outreach, error: oErr } = await supabase
      .from('outreach')
      .select('status, ai_category');
    if (oErr) throw oErr;

    const byStatus = {};
    let sent = 0, replied = 0, ready = 0;
    for (const row of outreach || []) {
      byStatus[row.status] = (byStatus[row.status] || 0) + 1;
      if (['Sent', 'Delivered', 'Follow-up 1', 'Follow-up 2', 'Replied', 'Closed'].includes(row.status)) sent += 1;
      if (row.status === 'Replied' || (row.ai_category && row.ai_category !== 'OTHER')) replied += 1;
      if (['Ready', 'Claimed'].includes(row.status)) ready += 1;
    }

    const { data: pending, error: pErr } = await supabase
      .from('personalization_results')
      .select('id')
      .eq('status', 'pending_review')
      .limit(500);
    if (pErr) throw pErr;

    const { data: importJobs, error: iErr } = await supabase
      .from('import_jobs')
      .select('status')
      .limit(500);
    if (iErr) throw iErr;

    const importByStatus = {};
    for (const j of importJobs || []) importByStatus[j.status] = (importByStatus[j.status] || 0) + 1;

    res.json({
      success: true,
      stats: {
        contacts: contacts || 0,
        campaigns: campaignCount || 0,
        outreach: { total: (outreach || []).length, sent, replied, ready, byStatus },
        reviewQueue: (pending || []).length,
        importJobs: importByStatus,
        config: {
          dailySendLimit: config.outreach.dailySendLimit,
          followup1Days: config.outreach.followup1Days,
          followup2Days: config.outreach.followup2Days,
          smtpHost: config.smtp.host,
          senderEmail: config.smtp.fromEmail,
          senderName: config.smtp.fromName,
          aiModel: config.ai.model,
          baseUrl: config.baseUrl,
        },
      },
    });
  } catch (err) {
    fail(res, err, 'Error building dashboard stats');
  }
});

// GET /api/profiles — profiles joined with contact info + enrichment & personalization status
// (Used by the personalization UI to pick profiles for AI generation)
dashboardRouter.get('/profiles', requireApiKey, async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*, contacts(*)');
    if (error) throw error;

    const ids = (profiles || []).map(p => p.id);
    const enrichCounts = new Map();
    const personalizationStatus = new Map();
    if (ids.length > 0) {
      const { data: enrich, error: eErr } = await supabase
        .from('enrichment_results')
        .select('profile_id');
      if (!eErr) {
        for (const r of enrich || []) enrichCounts.set(r.profile_id, (enrichCounts.get(r.profile_id) || 0) + 1);
      }

      const { data: pers, error: pErr } = await supabase
        .from('personalization_results')
        .select('profile_id, status, created_at')
        .in('profile_id', ids)
        .order('created_at', { ascending: false });
      if (!pErr) {
        for (const r of pers || []) {
          if (!personalizationStatus.has(r.profile_id)) personalizationStatus.set(r.profile_id, r.status);
        }
      }
    }

    res.json({
      success: true,
      profiles: (profiles || []).map(p => ({
        id: p.id,
        contactId: p.contact_id,
        fullName: p.full_name,
        organization: p.organization,
        role: p.role,
        college: p.college,
        createdAt: p.created_at,
        contactEmail: p.contacts?.email || null,
        contactName: p.contacts?.name || null,
        enrichmentCount: enrichCounts.get(p.id) || 0,
        personalizationStatus: personalizationStatus.get(p.id) || null,
      })),
    });
  } catch (err) {
    fail(res, err, 'Error listing profiles');
  }
});

// GET /api/import/jobs is provided by import.routes.js
