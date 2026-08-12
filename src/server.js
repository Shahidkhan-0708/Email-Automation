import express from 'express';
import jwt from 'jsonwebtoken';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';

// Database & Services
import { getOrCreateDefaultCampaign } from './db/campaigns.js';
import { createOrUpdateContact, markContactSuppressed } from './db/contacts.js';
import { getSupabaseClient } from './db/client.js';
import { processOutreachBatch } from './services/outreach.service.js';
import { processFollowUpsBatch } from './services/followup.service.js';
import { processIncomingReplies } from './services/reply.service.js';
import { syncSupabaseToAirtable } from './integrations/airtable/sync.js';

// Integrations & Webhooks
import { generateAuthUrl, exchangeCodeForTokens, testGmail } from './integrations/gmail/client.js';
import { webhookRouter } from './webhooks/email-events.js';
import { requireApiKey } from './middleware/api-key.js';

// Scheduled Jobs
import { scheduleOutreachJob } from './jobs/send-outreach.job.js';
import { scheduleFollowUpJob } from './jobs/followups.job.js';
import { scheduleReplyCheckJob } from './jobs/replies.job.js';
import { scheduleAirtableSyncJob } from './jobs/airtable-sync.job.js';
import { scheduleCleanupStaleClaimsJob } from './jobs/cleanup-stale-claims.job.js';

const app = express();
app.use(express.json());

// ----------------------------------------------------
// Health Check Endpoint
// ----------------------------------------------------
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'College Outreach Automation System V2',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    config: {
      dailySendLimit: config.outreach.dailySendLimit,
      smtpHost: config.smtp.host,
      senderEmail: config.smtp.fromEmail,
      aiModel: config.ai.model,
    },
  });
});

// ----------------------------------------------------
// Gmail OAuth 2.0 Flow & Test Endpoints
// ----------------------------------------------------
app.get('/api/test/gmail', testGmail);

app.get('/auth/google', (req, res) => {

  try {
    const url = generateAuthUrl();
    res.redirect(url);
  } catch (err) {
    logger.error('Error generating Google OAuth URL:', { error: err.message });
    res.status(500).send('Error generating Google OAuth URL');
  }
});

app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('Missing authorization code');
  }
  try {
    const tokens = await exchangeCodeForTokens(code);
    logger.info('Successfully obtained Google OAuth tokens.');

    res.send(`
      <h2>Google Authorization Successful!</h2>
      <p>Save the following <strong>Refresh Token</strong> in your <code>.env</code> file under <code>GMAIL_REFRESH_TOKEN</code>:</p>
      <pre style="background: #f4f4f4; padding: 15px; border-radius: 5px;">${tokens.refresh_token || 'No refresh token returned (was prompt=consent specified?)'}</pre>
    `);
  } catch (err) {
    logger.error('Error exchanging OAuth code:', { error: err.message });
    res.status(500).send(`OAuth Exchange Error: ${err.message}`);
  }
});

// ----------------------------------------------------
// Unsubscribe Endpoint
// ----------------------------------------------------
app.get('/unsubscribe', async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).send('Missing unsubscribe token');
  }
  try {
    const decoded = jwt.verify(token, config.security.unsubscribeJwtSecret);
    const supabase = getSupabaseClient();
    
    const { data: contact } = await supabase
      .from('contacts')
      .select('email')
      .eq('id', decoded.contactId)
      .maybeSingle();

    if (contact) {
      await markContactSuppressed(contact.email, 'User clicked unsubscribe link');
      logger.info(`Contact ${contact.email} unsubscribed successfully.`);
    }

    res.send(`
      <div style="max-width: 500px; margin: 50px auto; font-family: sans-serif; text-align: center;">
        <h2>You have been unsubscribed</h2>
        <p>Your email address has been removed from our outreach list and you will receive no further messages.</p>
      </div>
    `);
  } catch (err) {
    logger.error('Error processing unsubscribe token:', { error: err.message });
    res.status(400).send('Invalid or expired unsubscribe link.');
  }
});

// ----------------------------------------------------
// Webhooks Router
// ----------------------------------------------------
app.use('/webhooks', webhookRouter);

// ----------------------------------------------------
// Secured API Manual Trigger & Helper Endpoints
// ----------------------------------------------------
app.post('/api/trigger/outreach', requireApiKey, async (req, res) => {
  logger.info('Manual trigger request received for Outreach job.');
  try {
    const result = await processOutreachBatch();
    res.json({ success: true, result });
  } catch (err) {
    logger.error('Manual outreach trigger failed:', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/trigger/followups', requireApiKey, async (req, res) => {
  logger.info('Manual trigger request received for Follow-ups job.');
  try {
    const result = await processFollowUpsBatch();
    res.json({ success: true, result });
  } catch (err) {
    logger.error('Manual followups trigger failed:', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/trigger/replies', requireApiKey, async (req, res) => {
  logger.info('Manual trigger request received for Reply detection job.');
  try {
    const result = await processIncomingReplies();
    res.json({ success: true, result });
  } catch (err) {
    logger.error('Manual reply trigger failed:', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/trigger/airtable-sync', requireApiKey, async (req, res) => {
  logger.info('Manual trigger request received for Airtable sync job.');
  try {
    await syncSupabaseToAirtable();
    res.json({ success: true, message: 'Airtable sync triggered' });
  } catch (err) {
    logger.error('Manual airtable sync trigger failed:', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// Helper endpoint to seed a lead for testing
app.post('/api/leads', requireApiKey, async (req, res) => {
  try {
    const { name, email, organization, role, personalization, approvePersonalization = true } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and Email are required' });
    }

    const contact = await createOrUpdateContact({
      name,
      email,
      organization: organization || 'University',
      role: role || 'Professor',
      personalization: personalization || 'Recent paper on artificial intelligence',
      personalization_approved: Boolean(approvePersonalization),
    });

    const campaign = await getOrCreateDefaultCampaign();
    const supabase = getSupabaseClient();

    const { data: outreach, error } = await supabase
      .from('outreach')
      .upsert({
        contact_id: contact.id,
        campaign_id: campaign.id,
        status: 'Ready',
        sequence_step: 0,
        delivery_status: 'Pending',
      }, { onConflict: 'contact_id,campaign_id' })
      .select('*, contacts(*)')
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, contact, outreach });
  } catch (err) {
    logger.error('Error creating lead:', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// Register Cron Jobs & Start Server
// ----------------------------------------------------
scheduleOutreachJob();
scheduleFollowUpJob();
scheduleReplyCheckJob();
scheduleAirtableSyncJob();
scheduleCleanupStaleClaimsJob();

app.listen(config.port, '0.0.0.0', () => {
  logger.info(`=======================================================`);
  logger.info(`🚀 Outreach Automation Backend V2 running on port ${config.port}`);
  logger.info(`Environment: ${config.env}`);
  logger.info(`Health check: ${config.baseUrl}/health`);
  logger.info(`Google OAuth URL: ${config.baseUrl}/auth/google`);
  logger.info(`=======================================================`);
});
