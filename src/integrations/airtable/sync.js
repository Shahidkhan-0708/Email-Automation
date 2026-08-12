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
    const airtableRecords = chunk.map((r) => {
      const fields = {
        'Name': r.contacts?.name || r.id,
        'Email': r.contacts?.email || '',
      };

      if (r.contacts?.name) fields['Applicant Name'] = r.contacts.name;
      if (r.id) fields['Application ID'] = r.id;
      if (r.ai_summary || r.ai_category) {
        fields['Notes'] = `[${r.ai_category || 'REPLIED'}] ${r.ai_summary || ''} -> Next Action: ${r.ai_next_action || ''}`;
      }

      return { fields };
    });

    try {
      // Upsert into Airtable
      await table.create(airtableRecords);
    } catch (err) {
      logger.error(`Error syncing chunk to Airtable: ${err.message}`, { error: err });
    }
  }

  logger.info(`Synced ${records.length} records to Airtable dashboard.`);
}
