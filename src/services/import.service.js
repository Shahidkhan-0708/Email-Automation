import { parse as parseCsvSync } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
// pdf-parse's main entry runs a debug-mode test read at load time; the lib entry
// is the same implementation without that side effect.
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { logger } from '../utils/logger.js';
import { createImportJob, getImportJob, updateImportJob, listImportJobs } from '../db/import-jobs.js';
import { findContactByEmail, createOrUpdateContact } from '../db/contacts.js';
import { createOrUpdateProfile } from '../db/profiles.js';
import { getOrCreateDefaultCampaign } from '../db/campaigns.js';
import { getOutreachByContactAndCampaign } from '../db/outreach.js';
import { getSupabaseClient } from '../db/client.js';

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

// ------------------------------------------------------------
// Job creation & status
// ------------------------------------------------------------

export async function queueImport({ filename, fileType, buffer }) {
  if (buffer.length > MAX_FILE_BYTES) {
    throw new Error(`File exceeds maximum size of ${MAX_FILE_BYTES / (1024 * 1024)} MB`);
  }

  const fileData = buffer.toString('base64');
  return createImportJob({ filename, fileType, fileData });
}

export async function getImportStatus(jobId) {
  const job = await getImportJob(jobId);
  if (!job) throw new Error(`Import job ${jobId} not found`);
  const { file_data, ...safe } = job;
  return safe;
}

export async function getRecentImports(limit = 20) {
  const jobs = await listImportJobs(limit);
  return jobs.map(({ file_data, ...safe }) => safe);
}

// ------------------------------------------------------------
// Processing
// ------------------------------------------------------------

export async function processImportJob(jobId) {
  const job = await getImportJob(jobId);
  if (!job) throw new Error(`Import job ${jobId} not found`);

  if (job.status === 'processing') {
    logger.warn(`Import job ${jobId} is already being processed`);
    return job;
  }

  await updateImportJob(job.id, { status: 'processing' });

  try {
    const buffer = Buffer.from(job.file_data, 'base64');
    const rows = await extractRows(buffer, job.file_type);
    const result = await processRows(rows);

    await updateImportJob(job.id, {
      status: 'completed',
      total_records: rows.length,
      processed_records: result.processed,
      created_records: result.created,
      updated_records: result.updated,
      skipped_records: result.skipped,
      error_message: null,
    });

    logger.info(`Import job ${job.id} completed. Created: ${result.created}, Updated: ${result.updated}, Skipped: ${result.skipped}`);
    return getImportJob(job.id);
  } catch (err) {
    logger.error(`Import job ${job.id} failed:`, { error: err.message });
    await updateImportJob(job.id, {
      status: 'failed',
      error_message: err.message,
    });
    throw err;
  }
}

// ------------------------------------------------------------
// Parsers
// ------------------------------------------------------------

export async function extractRows(buffer, fileType) {
  switch (fileType) {
    case 'csv':
      return parseCsvBuffer(buffer);
    case 'xlsx':
      return parseXlsxBuffer(buffer);
    case 'pdf':
      return parsePdfBuffer(buffer);
    default:
      throw new Error(`Unsupported file type '${fileType}'`);
  }
}

function parseCsvBuffer(buffer) {
  const text = buffer.toString('utf-8');
  const records = parseCsvSync(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });
  return normalizeRows(records);
}

function parseXlsxBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) return [];
  const records = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
  return normalizeRows(records);
}

async function parsePdfBuffer(buffer) {
  const data = await pdfParse(buffer);
  const text = (data.text || '').trim();
  if (!text) return [];

  // PDFs often contain exported tables; attempt to parse the extracted
  // text as a delimited table (comma/tab/semicolon separated).
  try {
    const records = parseCsvSync(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      delimiter: detectDelimiter(text),
    });
    return normalizeRows(records);
  } catch (err) {
    logger.warn('PDF text could not be parsed as a table; treating each line as free text', { error: err.message });
    return normalizeRows(text.split('\n').filter(Boolean).map(line => ({ text: line })));
  }
}

function detectDelimiter(text) {
  const firstLine = text.split('\n').find(l => l.trim()) || '';
  const counts = ['\t', ';', ','].map(d => ({ d, n: (firstLine.match(new RegExp(`\\${d}`, 'g')) || []).length }));
  counts.sort((a, b) => b.n - a.n);
  return counts[0].n > 0 ? counts[0].d : ',';
}

// ------------------------------------------------------------
// Row normalization & persistence
// ------------------------------------------------------------

const KEY_ALIASES = {
  name: ['name', 'full_name', 'fullname', 'full name', 'person'],
  email: ['email', 'email address', 'e-mail', 'mail'],
  organization: ['organization', 'organisation', 'company', 'institution', 'university', 'college', 'org'],
  role: ['role', 'title', 'position', 'designation', 'job title'],
  personalization: ['personalization', 'notes', 'note', 'comment', 'topic', 'research area'],
};

export function normalizeRows(records) {
  return records
    .map(record => {
      const row = {};
      for (const [field, aliases] of Object.entries(KEY_ALIASES)) {
        row[field] = findValue(record, aliases);
      }
      row._source = record;
      return row;
    })
    .filter(r => r.name || r.email);
}

function findValue(record, aliases) {
  for (const key of Object.keys(record || {})) {
    const normalized = String(key).toLowerCase().trim();
    if (aliases.includes(normalized)) {
      const value = String(record[key] ?? '').trim();
      return value || undefined;
    }
  }
  return undefined;
}

async function processRows(rows) {
  const campaign = await getOrCreateDefaultCampaign();
  const seenEmails = new Set();

  const result = { processed: 0, created: 0, updated: 0, skipped: 0, errors: [] };

  for (const row of rows) {
    const email = (row.email || '').toLowerCase().trim();
    if (!email || !email.includes('@')) {
      result.skipped += 1;
      continue;
    }
    if (seenEmails.has(email)) {
      result.skipped += 1;
      continue;
    }
    seenEmails.add(email);

    try {
      const existing = await findContactByEmail(email);
      const isNew = !existing;

      const contact = await createOrUpdateContact({
        name: row.name || email.split('@')[0],
        email,
        organization: row.organization || existing?.organization,
        role: row.role || existing?.role,
        personalization: row.personalization || existing?.personalization,
        personalization_approved: existing?.personalization_approved ?? false,
      });

      await createOrUpdateProfile({
        contact_id: contact.id,
        full_name: row.name || contact.name,
        organization: row.organization || contact.organization,
        role: row.role || contact.role,
      });

      await ensureOutreachRecord(contact.id, campaign.id);

      if (isNew) result.created += 1;
      else result.updated += 1;
      result.processed += 1;
    } catch (err) {
      result.errors.push({ email, error: err.message });
      logger.error(`Import failed for row ${email}:`, { error: err.message });
    }
  }

  return result;
}

async function ensureOutreachRecord(contactId, campaignId) {
  const existing = await getOutreachByContactAndCampaign(contactId, campaignId);
  if (existing) return existing;

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('outreach')
    .insert({
      contact_id: contactId,
      campaign_id: campaignId,
      status: 'Ready',
      claim_id: null,
      claimed_at: null,
      sequence_step: 0,
      delivery_status: 'Pending',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
