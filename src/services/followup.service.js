import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { delay } from '../utils/delay.js';
import { renderEmailTemplate } from '../utils/template-engine.js';
import { getFollowUpsDue, updateOutreachRecord } from '../db/outreach.js';
import { sendEmail } from '../integrations/email/provider.js';

export async function processFollowUpsBatch() {
  logger.info('Starting follow-up processing job.');

  const dueRecords = await getFollowUpsDue();
  if (dueRecords.length === 0) {
    logger.info('No follow-ups due at this time.');
    return { due: 0, sent: 0, closed: 0, failed: 0 };
  }

  logger.info(`Found ${dueRecords.length} follow-ups due for processing.`);

  let sentCount = 0;
  let closedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < dueRecords.length; i++) {
    const record = dueRecords[i];
    const contact = record.contacts;

    // Strict guard checks
    if (!contact || contact.do_not_contact || contact.suppressed || ['Replied', 'Closed'].includes(record.status)) {
      logger.info(`Skipping follow-up for ${contact?.email || record.id} - status: ${record.status}, DNC: ${contact?.do_not_contact}`);
      continue;
    }

    const currentStep = record.sequence_step || 0;
    let nextStatus = '';
    let templateName = '';
    let intervalDays = 0;

    if (currentStep === 0) {
      nextStatus = 'Follow-up 1';
      templateName = 'followup1';
      intervalDays = config.outreach.followup2Days;
    } else if (currentStep === 1) {
      nextStatus = 'Follow-up 2';
      templateName = 'followup2';
      intervalDays = 0; // Final step
    } else {
      // Sequence completed with no reply -> Close lead
      await updateOutreachRecord(record.id, { status: 'Closed' });
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

      await updateOutreachRecord(record.id, {
        status: nextStatus,
        last_outbound_at: now.toISOString(),
        next_action_at: nextDate,
        sequence_step: currentStep + 1,
        provider_message_id: emailRes.messageId,
        delivery_status: 'Sent',
        error_message: null,
      });

      sentCount++;
      logger.info(`Sent ${nextStatus} to ${contact.email}`);
    } catch (err) {
      failedCount++;
      logger.error(`Error sending ${nextStatus} to ${contact.email}:`, { error: err.message });
      await updateOutreachRecord(record.id, { error_message: `Followup error: ${err.message}` });
    }

    if (i < dueRecords.length - 1 && config.outreach.sendDelayMs > 0) {
      await delay(config.outreach.sendDelayMs);
    }
  }

  logger.info(`Follow-up job finished. Sent: ${sentCount}, Closed: ${closedCount}, Failed: ${failedCount}`);
  return { due: dueRecords.length, sent: sentCount, closed: closedCount, failed: failedCount };
}
