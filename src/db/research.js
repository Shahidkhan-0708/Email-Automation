import { getSupabaseClient } from './client.js';
import { logger } from '../utils/logger.js';

// ---------------------------------------------------------------------------
// Research state persistence (profiles.research_* columns, migration
// 20240101000400). The columns are optional: we feature-detect them once per
// process so the app works before AND after the migration is applied in
// Supabase. Without the columns, live job state lives in the in-memory
// registry (services/research.service.js) and evidence still persists in
// enrichment_results.
// ---------------------------------------------------------------------------

const RESEARCH_COLUMNS = [
  'research_status',
  'research_stage',
  'research_identity_confidence',
  'research_best_match',
  'research_candidates',
  'research_last_run_at',
  'research_error',
];

let columnsPromise = null;

function hasResearchColumns() {
  if (columnsPromise) return columnsPromise;
  columnsPromise = (async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'profiles')
        .in('column_name', RESEARCH_COLUMNS);
      if (error) {
        logger.warn('Could not inspect profiles columns for research state:', { error: error.message });
        return false;
      }
      const found = new Set((data || []).map(r => r.column_name));
      return RESEARCH_COLUMNS.every(c => found.has(c));
    } catch {
      return false;
    }
  })();
  return columnsPromise;
}

/** Persist research job state for a profile. No-op if the columns are absent. */
export async function updateResearchState(profileId, fields) {
  if (!(await hasResearchColumns())) return;
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('profiles')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', profileId);
  if (error) {
    logger.warn(`Could not persist research state for profile ${profileId}:`, { error: error.message });
  }
}

/** Read persisted research state for a profile (or null when absent). */
export async function getPersistedResearchState(profileId) {
  if (!(await hasResearchColumns())) return null;
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('research_status, research_stage, research_identity_confidence, research_best_match, research_candidates, research_last_run_at, research_error')
    .eq('id', profileId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}
