import { getSupabaseClient } from './client.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

export async function getOrCreateDefaultCampaign() {
  const supabase = getSupabaseClient();
  const defaultName = 'V1 College Outreach Initiative';

  // NOTE: name is not unique, so use a deterministic single-row lookup.
  // (maybeSingle() errors when multiple rows match on this PostgREST setup.)
  const { data: existing, error: selectErr } = await supabase
    .from('campaigns')
    .select('*')
    .eq('name', defaultName)
    .order('created_at', { ascending: true })
    .limit(1);

  if (selectErr) {
    logger.error('Error fetching campaign:', { error: selectErr.message });
  }

  if (existing && existing.length > 0) return existing[0];

  const { data: created, error: insertErr } = await supabase
    .from('campaigns')
    .insert({
      name: defaultName,
      description: 'Default outreach campaign for college initiative',
      status: 'Active',
      sender_email: config.smtp.fromEmail,
      sender_name: config.smtp.fromName,
    })
    .select()
    .single();

  if (insertErr) {
    logger.error('Error creating default campaign:', { error: insertErr.message });
    return {
      id: '00000000-0000-0000-0000-000000000001',
      name: defaultName,
      sender_email: config.smtp.fromEmail,
      sender_name: config.smtp.fromName,
    };
  }

  return created;
}
