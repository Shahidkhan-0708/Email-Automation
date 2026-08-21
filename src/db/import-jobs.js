import { getSupabaseClient } from './client.js';
import { logger } from '../utils/logger.js';

// 'image' covers OCR'd uploads (.png/.jpg/.jpeg/.webp/.bmp) — the import route
// resolves those to fileType 'image' before queueing.
const VALID_TYPES = ['pdf', 'xlsx', 'csv', 'image'];

export async function createImportJob({ filename, fileType, fileData }) {
  if (!VALID_TYPES.includes(fileType)) {
    throw new Error(`Unsupported file type '${fileType}'. Must be one of: ${VALID_TYPES.join(', ')}`);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('import_jobs')
    .insert({
      filename,
      file_type: fileType,
      file_data: fileData,
      status: 'queued',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    logger.error('Error creating import job:', { filename, error: error.message });
    throw error;
  }
  return data;
}

export async function getImportJob(id) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('import_jobs')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    logger.error(`Error getting import job ${id}:`, { error: error.message });
    throw error;
  }
  return data;
}

export async function updateImportJob(id, fields) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('import_jobs')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error(`Error updating import job ${id}:`, { error: error.message });
    throw error;
  }
  return data;
}

export async function getNextQueuedImportJob() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('import_jobs')
    .select('*')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error('Error getting next queued import job:', { error: error.message });
    throw error;
  }
  return data;
}

/**
 * Recover import jobs stuck in 'processing' (e.g. the process crashed mid-run).
 * Jobs older than `timeoutMinutes` are moved back to 'queued' so the cron can
 * retry them — contacts/profile/outreach writes are idempotent, so re-running
 * is safe. Returns the number of jobs recovered.
 */
export async function recoverStaleImportJobs(timeoutMinutes = 10) {
  const supabase = getSupabaseClient();
  const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('import_jobs')
    .update({
      status: 'queued',
      error_message: 'Recovered: previous run was interrupted; will retry.',
      updated_at: new Date().toISOString(),
    })
    .eq('status', 'processing')
    .lte('updated_at', cutoff)
    .select('id');

  if (error) {
    logger.error('Error recovering stale import jobs:', { error: error.message });
    return 0;
  }
  if (data && data.length > 0) {
    logger.info(`Recovered ${data.length} stale import job(s) back to queued`);
  }
  return data ? data.length : 0;
}

export async function listImportJobs(limit = 20) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('import_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Error listing import jobs:', { error: error.message });
    throw error;
  }
  return data || [];
}
