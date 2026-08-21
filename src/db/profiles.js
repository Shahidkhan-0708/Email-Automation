import { getSupabaseClient } from './client.js';
import { logger } from '../utils/logger.js';

// Columns that exist in the profiles table.  The insert/upsert rejects
// any key that isn't a real column, so we whitelist explicitly.
const PROFILE_COLUMNS = new Set([
  'id', 'contact_id', 'full_name', 'organization', 'role',
  'college', 'degree', 'graduation_year', 'skills', 'projects',
  'experience', 'public_profile_urls', 'linkedin_url',
  'research_status', 'identity_confidence', 'best_match',
  'candidates_count', 'research_last_run_at', 'research_error',
  'research_steps', 'created_at', 'updated_at',
]);

function pickProfileColumns(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (PROFILE_COLUMNS.has(k) && v !== undefined) out[k] = v;
  }
  return out;
}

export async function createOrUpdateProfile(profileData) {
  const supabase = getSupabaseClient();
  const normalized = pickProfileColumns({
    ...profileData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // One profile per contact: prefer an existing row, otherwise insert.
  // (Avoids relying on a unique constraint on profiles.contact_id for upsert.)
  const { data: existing, error: findErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('contact_id', normalized.contact_id)
    .limit(1);

  if (findErr) {
    logger.error('Error finding profile:', { profileData, error: findErr.message });
    throw findErr;
  }

  if (existing && existing.length > 0) {
    const { data, error } = await supabase
      .from('profiles')
      .update(normalized)
      .eq('id', existing[0].id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating profile:', { profileData, error: error.message });
      throw error;
    }

    return data;
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert(normalized)
    .select()
    .single();

  if (error) {
    logger.error('Error creating profile:', { profileData, error: error.message });
    throw error;
  }

  return data;
}

export async function getProfile(profileId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (error) {
    logger.error('Error getting profile:', { profileId, error: error.message });
    throw error;
  }

  return data;
}

export async function getProfilesByCampaign(campaignId) {
  const supabase = getSupabaseClient();

  // The profiles table has no campaign_id; profiles are linked to campaigns
  // through their contact's outreach records.
  const { data: outreach, error: outreachErr } = await supabase
    .from('outreach')
    .select('contact_id')
    .eq('campaign_id', campaignId);

  if (outreachErr) {
    logger.error('Error getting outreach for campaign:', { campaignId, error: outreachErr.message });
    throw outreachErr;
  }

  const contactIds = (outreach || []).map(r => r.contact_id);
  if (contactIds.length === 0) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('contact_id', contactIds);

  if (error) {
    logger.error('Error getting profiles by campaign:', { campaignId, error: error.message });
    throw error;
  }

  return data || [];
}

export async function updateProfile(profileId, updates) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', profileId)
    .select()
    .single();

  if (error) {
    logger.error('Error updating profile:', { profileId, error: error.message });
    throw error;
  }

  return data;
}