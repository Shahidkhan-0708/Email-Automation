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

const APPLICATION_ID_FIELD = 'Application ID';
const BATCH_SIZE = 10;

/**
 * Idempotent sync: outreach rows are keyed on Airtable by their 'Application ID'
 * (the Supabase outreach UUID). Existing Airtable records are updated in place;
 * only genuinely new rows are created — re-running this job (cron every 30 min,
 * manual triggers, or overlapping runs) never accumulates duplicates.
 */
export async function syncSupabaseToAirtable() {
  const base = getAirtableBase();
  if (!base) {
    logger.debug('Airtable credentials not configured. Skipping dashboard sync.');
    return;
  }

  const supabase = getSupabaseClient();

  const { data: records, error } = await supabase
    .from('outreach')
    .select('*, contacts(*)');

  if (error || !records || records.length === 0) {
    if (error) logger.error('Error fetching outreach for Airtable sync:', { error: error.message });
    return;
  }

  const table = base(config.airtable.tableName);

  // Build applicationId -> Airtable record id map from existing rows.
  const existingByAppId = new Map();
  try {
    const existing = await table.select({
      fields: [APPLICATION_ID_FIELD],
      pageSize: BATCH_SIZE,
    }).all();
    for (const rec of existing) {
      const appId = rec.fields[APPLICATION_ID_FIELD];
      if (appId && !existingByAppId.has(appId)) existingByAppId.set(String(appId), rec.id);
    }
  } catch (err) {
    logger.error('Error reading existing Airtable records:', { error: err.message });
    return;
  }

  const toCreate = [];
  const toUpdate = [];
  for (const r of records) {
    const fields = buildFields(r);
    const airtableId = existingByAppId.get(r.id);
    if (airtableId) toUpdate.push({ id: airtableId, fields });
    else toCreate.push({ fields });
  }

  // Group into batches of 10 for Airtable API quota safety.
  for (let i = 0; i < toCreate.length; i += BATCH_SIZE) {
    try {
      await table.create(toCreate.slice(i, i + BATCH_SIZE));
    } catch (err) {
      logger.error(`Error creating Airtable chunk: ${err.message}`, { error: err });
    }
  }

  for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
    try {
      await table.update(toUpdate.slice(i, i + BATCH_SIZE));
    } catch (err) {
      logger.error(`Error updating Airtable chunk: ${err.message}`, { error: err });
    }
  }

  logger.info(`Synced ${records.length} records to Airtable dashboard. Created: ${toCreate.length}, Updated: ${toUpdate.length}`);
}

function buildFields(r) {
  const fields = {
    'Name': r.contacts?.name || r.id,
    'Email': r.contacts?.email || '',
  };

  if (r.contacts?.name) fields['Applicant Name'] = r.contacts.name;
  if (r.id) fields[APPLICATION_ID_FIELD] = r.id;
  if (r.ai_summary || r.ai_category) {
    fields['Notes'] = `[${r.ai_category || 'REPLIED'}] ${r.ai_summary || ''} -> Next Action: ${r.ai_next_action || ''}`;
  }

  return fields;
}
