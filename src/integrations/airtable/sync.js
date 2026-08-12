import Airtable from 'airtable';
import { config } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { getSupabaseClient } from '../../db/client.js';

let airtableBase = null;

function getAirtableBase() {
  if (!airtableBase) {
    if (!config.airtable.token || !config.airtable.baseId || config.airtable.token.includes('mock')) {
      return null;
    }
    airtableBase = new Airtable({ apiKey: config.airtable.token }).base(config.airtable.baseId);
  }
  return airtableBase;
}

export async function syncSupabaseToAirtable() {
  const base = getAirtableBase();
  if (!base) {
    logger.debug('Airtable credentials not configured. Skipping dashboard sync.');
    return;
  }

  const supabase = getSupabaseClient();
  
  // Fetch outreach records updated recently or marked for sync
  const { data: records, error } = await supabase
    .from('outreach')
    .select('*, contacts(*)');

  if (error || !records || records.length === 0) return;

  const table = base(config.airtable.tableName);

  // Group into batches of 10 for Airtable API quota safety
  for (let i = 0; i < records.length; i += 10) {
    const chunk = records.slice(i, i + 10);
    const airtableRecords = chunk.map((r) => ({
      fields: {
        'Name': r.contacts?.name || '',
        'Email': r.contacts?.email || '',
        'Organization': r.contacts?.organization || '',
        'Role': r.contacts?.role || '',
        'Personalization': r.contacts?.personalization || '',
        'Subject': r.subject || '',
        'Email Body': r.email_body || '',
        'Status': r.status || 'Ready',
        'Sent At': r.sent_at ? new Date(r.sent_at).toISOString() : null,
        'Follow-up At': r.next_action_at ? new Date(r.next_action_at).toISOString() : null,
        'Follow-up Stage': r.sequence_step || 0,
        'Reply': r.reply_body || '',
        'Reply Received At': r.reply_received_at ? new Date(r.reply_received_at).toISOString() : null,
        'AI Category': r.ai_category || null,
        'AI Summary': r.ai_summary || '',
        'Next Action': r.ai_next_action || '',
        'Gmail Message ID': r.gmail_message_id || '',
        'Gmail Thread ID': r.gmail_thread_id || '',
        'Do Not Contact': Boolean(r.contacts?.do_not_contact),
        'Error': r.error_message || '',
      },
    }));

    try {
      // Upsert into Airtable
      await table.create(airtableRecords);
    } catch (err) {
      logger.error('Error syncing chunk to Airtable:', { error: err.message });
    }
  }

  logger.info(`Synced ${records.length} records to Airtable dashboard.`);
}
