import { logger } from '../utils/logger.js';
import { getRecentReplies } from '../integrations/gmail/client.js';
import { classifyReply } from '../integrations/ai/classifier.js';
import { 
  isGmailMessageProcessed, 
  markGmailMessageProcessed, 
  findOutreachByGmailThreadId, 
  updateOutreachRecord 
} from '../db/outreach.js';
import { findContactByEmail } from '../db/contacts.js';
import { getSupabaseClient } from '../db/client.js';

export async function processIncomingReplies() {
  logger.info('Starting incoming reply detection job.');

  const recentReplies = await getRecentReplies();
  if (recentReplies.length === 0) {
    logger.info('No new incoming replies found in Gmail inbox.');
    return { fetched: 0, processed: 0, skipped: 0 };
  }

  logger.info(`Fetched ${recentReplies.length} messages from Gmail inbox.`);

  let processedCount = 0;
  let skippedCount = 0;

  for (const reply of recentReplies) {
    // 1. Deduplication check
    const alreadyProcessed = await isGmailMessageProcessed(reply.id);
    if (alreadyProcessed) {
      skippedCount++;
      continue;
    }

    // 2. Primary matching: Thread ID
    let outreachRecord = null;
    if (reply.threadId) {
      outreachRecord = await findOutreachByGmailThreadId(reply.threadId);
    }

    // 3. Fallback matching: Sender Email
    if (!outreachRecord && reply.fromEmail) {
      const contact = await findContactByEmail(reply.fromEmail);
      if (contact) {
        const supabase = getSupabaseClient();
        const { data: records } = await supabase
          .from('outreach')
          .select('*, contacts(*)')
          .eq('contact_id', contact.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (records && records.length > 0) {
          outreachRecord = records[0];
        }
      }
    }

    if (!outreachRecord) {
      logger.debug(`No matching outreach record found for reply from ${reply.fromEmail}. Skipping.`);
      await markGmailMessageProcessed(reply.id);
      skippedCount++;
      continue;
    }

    // Guard: Skip if already marked Replied
    if (outreachRecord.status === 'Replied') {
      logger.info(`Record ${outreachRecord.id} is already marked Replied. Marking message ${reply.id} processed.`);
      await markGmailMessageProcessed(reply.id);
      skippedCount++;
      continue;
    }

    logger.info(`Matching reply detected for contact ${outreachRecord.contacts?.name || reply.fromEmail}. Classifying reply...`);

    // 4. AI Reply Classification
    const classification = await classifyReply(reply.body);

    // 5. Update Outreach State
    const now = new Date().toISOString();
    await updateOutreachRecord(outreachRecord.id, {
      status: 'Replied',
      reply_body: reply.body,
      reply_received_at: reply.receivedAt || now,
      gmail_message_id: reply.id,
      gmail_thread_id: reply.threadId,
      last_inbound_at: now,
      ai_category: classification.category,
      ai_confidence: classification.confidence,
      ai_sentiment: classification.sentiment,
      ai_summary: classification.summary,
      ai_next_action: classification.nextAction,
      ai_suggested_followup_date: classification.suggestedFollowUpDate,
      ai_requires_human_review: classification.requiresHumanReview,
    });

    await markGmailMessageProcessed(reply.id);
    processedCount++;
    logger.info(`Successfully processed reply for ${reply.fromEmail}. AI Category: ${classification.category}`);
  }

  logger.info(`Reply detection job complete. Processed: ${processedCount}, Skipped: ${skippedCount}`);
  return { fetched: recentReplies.length, processed: processedCount, skipped: skippedCount };
}
