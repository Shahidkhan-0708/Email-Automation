import { getSupabaseClient } from './client.js';
import { logger } from '../utils/logger.js';

const VALID_TYPES = ['pdf', 'xlsx', 'csv'];

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
