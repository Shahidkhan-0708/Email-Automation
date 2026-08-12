import { getSupabaseClient } from './client.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

export async function getOrCreateDefaultCampaign() {
  const supabase = getSupabaseClient();
  const defaultName = 'V1 College Outreach Initiative';
  
  const { data: existing, error: selectErr } = await supabase
    .from('campaigns')
    .select('*')
    .eq('name', defaultName)
    .maybeSingle();

  if (selectErr) {
    logger.error('Error fetching campaign:', { error: selectErr.message });
  }

  if (existing) return existing;

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
