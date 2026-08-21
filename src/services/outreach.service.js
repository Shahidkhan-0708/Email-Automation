import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { delay } from '../utils/delay.js';
import { mapWithConcurrency } from '../utils/pool.js';
import { claimReadyLeads, updateOutreachRecord } from '../db/outreach.js';
import { getPersonalization } from '../db/personalization.js';
import { sendEmail } from '../integrations/email/provider.js';

export async function processOutreachBatch() {
  const jobId = uuidv4();
  const limit = config.outreach.dailySendLimit;

  logger.info(`[Outreach Job ${jobId}] Starting outreach run. Limit: ${limit}`);

  const claimedLeads = await claimReadyLeads(jobId, limit);
  if (claimedLeads.length === 0) {
    logger.info(`[Outreach Job ${jobId}] No eligible ready leads found to claim.`);
    return { claimed: 0, sent: 0, failed: 0 };
  }

  logger.info(`[Outreach Job ${jobId}] Claimed ${claimedLeads.length} leads for sending.`);

  let sentCount = 0;
  let failedCount = 0;
  let authStopped = false;

  const concurrency = Math.max(1, config.outreach.smtpConcurrency);
  await mapWithConcurrency(claimedLeads, concurrency, async (record) => {
    if (authStopped) return; // halt remaining sends after an auth failure

    const contact = record.contacts;

    if (!contact || contact.do_not_contact || contact.suppressed) {
      logger.warn(`Skipping claimed record ${record.id} - contact suppressed or do not contact.`);
      await updateOutreachRecord(record.id, { status: 'Closed', error_message: 'Contact suppressed' });
      return;
    }

    // Strict pipeline: a send REQUIRES an approved/edited personalization.
    // The generic template is intentionally never sent to a real recipient:
    // the whole product point is evidence-cited, human-approved outreach, and
    // claimReadyLeads already excludes records without one. This check is
    // defense-in-depth for the race where the draft is rejected between the
    // claim and the send — such records are parked as Error, never sent.
    let aiContent = null;
    if (record.personalization_id) {
      try {
        const personalization = await getPersonalization(record.personalization_id);
        if (personalization && (personalization.status === 'approved' || personalization.status === 'edited')) {
          aiContent = {
            subject: personalization.edited_subject || personalization.subject,
            body: personalization.edited_body || personalization.body,
          };
        }
      } catch (err) {
        logger.warn(`Could not load personalization ${record.personalization_id}`, { error: err.message });
      }
    }
    if (!aiContent) {
      await updateOutreachRecord(record.id, {
        status: 'Error',
        error_message: 'No approved personalization linked — template fallback is disabled (pipeline enforcement)',
        error_category: 'pipeline',
      });
      return;
    }

    const finalSubject = aiContent.subject;
    const finalBody = aiContent.body;
    const finalHtml = plainTextToHtml(finalBody);

    try {
      // Update status to Sending right before network call
      await updateOutreachRecord(record.id, { status: 'Sending', subject: finalSubject, email_body: finalHtml });

      const emailRes = await sendEmail({
        toEmail: contact.email,
        toName: contact.name,
        subject: finalSubject,
        html: finalHtml,
        text: finalBody,
      });

      const now = new Date();
      const nextFollowupDate = new Date(now.getTime() + config.outreach.followup1Days * 86400 * 1000);

      await updateOutreachRecord(record.id, {
        status: 'Sent',
        sent_at: now.toISOString(),
        last_outbound_at: now.toISOString(),
        next_action_at: nextFollowupDate.toISOString(),
        sequence_step: 0,
        provider_message_id: emailRes.messageId,
        delivery_status: 'Sent',
        error_message: null,
      });

      sentCount++;
      logger.info(`[Outreach Job ${jobId}] Sent initial email to ${contact.email}`);

      // Pace sends even under concurrency: each worker waits before its next send.
      if (config.outreach.sendDelayMs > 0) {
        await delay(config.outreach.sendDelayMs);
      }
    } catch (err) {
      failedCount++;
      const category = err.category || 'provider_error';
      logger.error(`[Outreach Job ${jobId}] Error sending email to ${contact.email}:`, { category, error: err.message });

      if (category === 'auth_error') {
        logger.error('CRITICAL: Authentication failed with SMTP provider. Halting outreach job immediately!');
        authStopped = true;
        await updateOutreachRecord(record.id, { status: 'Error', error_message: err.message, error_category: category });
        return;
      }

      if (category === 'invalid_email') {
        await updateOutreachRecord(record.id, { status: 'Error', error_message: 'Invalid recipient address', error_category: category });
      } else if (category === 'rate_limit') {
        // Release claim back to Ready so it can be retried next cycle
        await updateOutreachRecord(record.id, { status: 'Ready', claim_id: null, error_message: err.message });
      } else {
        await updateOutreachRecord(record.id, { status: 'Error', error_message: err.message, error_category: category });
      }
    }
  });

  logger.info(`[Outreach Job ${jobId}] Run completed. Sent: ${sentCount}, Failed: ${failedCount}`);
  return { claimed: claimedLeads.length, sent: sentCount, failed: failedCount, authStopped };
}

function plainTextToHtml(text) {
  if (!text) return '';
  return text
    .split(/\n\s*\n/)
    .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}
