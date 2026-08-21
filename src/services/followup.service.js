import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { delay } from '../utils/delay.js';
import { renderEmailTemplate } from '../utils/template-engine.js';
import { getFollowUpsDue, updateOutreachRecord, claimFollowUpsDue } from '../db/outreach.js';
import { sendEmail } from '../integrations/email/provider.js';

/**
 * Follow-up state machine (crash-safe + duplicate-safe):
 *
 *   1. Select due records (status Sent / Follow-up 1, next_action_at <= now).
 *   2. Atomically claim them: status -> 'Sending' with claim_id `fu:<jobId>`.
 *      The claim update is guarded by the pre-follow-up statuses, so a second
 *      concurrent job can never claim (or send) the same record twice.
 *   3. Send. On success the record advances (FU1 -> Follow-up 1, FU2 -> Closed);
 *      on failure it is restored to its pre-follow-up status so the next cycle
 *      retries it. A crash mid-send leaves the row 'Sending' with an `fu:` claim
 *      — resetStaleClaims() restores it by sequence_step.
 *
 * Sends are at-least-once: if the provider accepted the email but the process
 * died before the database update, a retry can duplicate that one follow-up.
 * That window is unavoidable without provider-side dedup keys; the claim guard
 * prevents all duplicate sends caused by concurrent job runs.
 */
export async function processFollowUpsBatch() {
  const jobId = uuidv4();
  logger.info(`[Follow-up Job ${jobId}] Starting follow-up processing job.`);

  const dueRecords = await getFollowUpsDue();
  if (dueRecords.length === 0) {
    logger.info(`[Follow-up Job ${jobId}] No follow-ups due at this time.`);
    return { due: 0, claimed: 0, sent: 0, closed: 0, failed: 0 };
  }

  logger.info(`[Follow-up Job ${jobId}] Found ${dueRecords.length} follow-ups due.`);

  // Atomically claim only rows still in a pre-follow-up status (guards against
  // concurrent runs of this job sending the same follow-up twice).
  const claimed = await claimFollowUpsDue(dueRecords.map(r => r.id), `fu:${jobId}`);
  if (claimed.length === 0) {
    logger.info(`[Follow-up Job ${jobId}] All due records were claimed by another run.`);
    return { due: dueRecords.length, claimed: 0, sent: 0, closed: 0, failed: 0 };
  }

  let sentCount = 0;
  let closedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < claimed.length; i++) {
    const record = claimed[i];
    const contact = record.contacts;

    // Defensive: the claim query filtered suppressed/DNC contacts already.
    if (!contact || contact.do_not_contact || contact.suppressed) {
      await releaseFollowUpClaim(record.id, record.sequence_step, 'Contact suppressed');
      continue;
    }

    const currentStep = record.sequence_step || 0;
    const plan = planFollowUpStep(currentStep);
    let nextStatus = plan.nextStatus;
    let templateName = plan.templateName;
    let intervalDays = plan.intervalDays;

    if (plan.close) {
      // Sequence completed with no reply -> Close lead
      await updateOutreachRecord(record.id, { status: 'Closed', claim_id: null, claimed_at: null });
      closedCount++;
      logger.info(`Sequence completed for ${contact.email}. Marked as Closed.`);
      continue;
    }

    const firstName = (contact.name || '').split(' ')[0] || contact.name;
    const templateData = {
      contactId: contact.id,
      firstName,
      organization: contact.organization,
      role: contact.role,
      personalization: contact.personalization,
      senderName: config.smtp.fromName,
      subject: `Re: Connecting with ${contact.name} - University Initiative`,
    };

    const rendered = renderEmailTemplate(templateName, templateData);

    try {
      const emailRes = await sendEmail({
        toEmail: contact.email,
        toName: contact.name,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      });

      const now = new Date();
      const nextDate = intervalDays > 0 ? new Date(now.getTime() + intervalDays * 86400 * 1000).toISOString() : null;

      // Final follow-up (Follow-up 2) closes the sequence: the terminal state
      // is Closed. Earlier rows in the database stay 'Sent'/'Follow-up 1' with
      // `next_action_at` in the past, so a stale 'Follow-up 2' row can never
      // be picked up again and re-sent.
      const terminal = intervalDays === 0 ? 'Closed' : nextStatus;

      await updateOutreachRecord(record.id, {
        status: terminal,
        last_outbound_at: now.toISOString(),
        next_action_at: nextDate,
        sequence_step: currentStep + 1,
        provider_message_id: emailRes.messageId,
        delivery_status: 'Sent',
        error_message: null,
        claim_id: null,
        claimed_at: null,
      });

      if (terminal === 'Closed') closedCount++;
      else sentCount++;
      logger.info(`Sent ${nextStatus} to ${contact.email}`);
    } catch (err) {
      failedCount++;
      logger.error(`Error sending ${nextStatus} to ${contact.email}:`, { error: err.message });
      // Restore the pre-follow-up status so the next cycle retries this record
      // (next_action_at is untouched, so it remains due).
      await releaseFollowUpClaim(record.id, currentStep, `Followup error: ${err.message}`);
    }

    if (i < claimed.length - 1 && config.outreach.sendDelayMs > 0) {
      await delay(config.outreach.sendDelayMs);
    }
  }

  logger.info(`[Follow-up Job ${jobId}] Finished. Sent: ${sentCount}, Closed: ${closedCount}, Failed: ${failedCount}`);
  return { due: dueRecords.length, claimed: claimed.length, sent: sentCount, closed: closedCount, failed: failedCount };
}

/**
 * Pure state-machine planner for one follow-up step. Exported for tests.
 * sequence_step semantics: 0 = initial email sent (next: Follow-up 1),
 * 1 = Follow-up 1 sent (next: Follow-up 2), >= 2 = sequence exhausted (close).
 */
export function planFollowUpStep(sequenceStep) {
  if (sequenceStep === 0) {
    return { nextStatus: 'Follow-up 1', templateName: 'followup1', intervalDays: config.outreach.followup2Days, final: false };
  }
  if (sequenceStep === 1) {
    return { nextStatus: 'Follow-up 2', templateName: 'followup2', intervalDays: 0, final: true };
  }
  return { close: true };
}

/** Restore a claimed follow-up record to its pre-follow-up status. */
async function releaseFollowUpClaim(id, sequenceStep, errorMessage) {
  const restore = sequenceStep >= 1 ? 'Follow-up 1' : 'Sent';
  await updateOutreachRecord(id, {
    status: restore,
    claim_id: null,
    claimed_at: null,
    error_message: errorMessage,
  });
}
