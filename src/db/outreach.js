import { getSupabaseClient } from './client.js';
import { logger } from '../utils/logger.js';

export async function claimReadyLeads(claimId, limit = 10) {
  const supabase = getSupabaseClient();
  
  // 1. Select eligible records
  const { data: eligible, error: selectErr } = await supabase
    .from('outreach')
    .select('*, contacts!inner(*)')
    .eq('status', 'Ready')
    .eq('contacts.do_not_contact', false)
    .eq('contacts.suppressed', false)
    .eq('contacts.personalization_approved', true)
    .limit(limit);

  if (selectErr || !eligible || eligible.length === 0) {
    if (selectErr) logger.error('Error selecting ready leads:', { error: selectErr.message });
    return [];
  }

  const ids = eligible.map(row => row.id);
  const now = new Date().toISOString();

  // 2. Atomically claim them
  const { data: claimed, error: updateErr } = await supabase
    .from('outreach')
    .update({
      status: 'Claimed',
      claim_id: claimId,
      claimed_at: now,
      updated_at: now,
    })
    .in('id', ids)
    .select('*, contacts(*)');

  if (updateErr) {
    logger.error('Error claiming leads:', { error: updateErr.message });
    return [];
  }

  return claimed || [];
}

export async function getFollowUpsDue() {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('outreach')
    .select('*, contacts!inner(*)')
    .lte('next_action_at', now)
    .in('status', ['Sent', 'Follow-up 1'])
    .eq('contacts.do_not_contact', false)
    .eq('contacts.suppressed', false);

  if (error) {
    logger.error('Error getting follow ups due:', { error: error.message });
    return [];
  }

  return data || [];
}

export async function getOutreachByContactAndCampaign(contactId, campaignId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('outreach')
    .select('*')
    .eq('contact_id', contactId)
    .eq('campaign_id', campaignId)
    .maybeSingle();

  if (error) {
    logger.error('Error getting outreach by contact/campaign:', { contactId, campaignId, error: error.message });
    throw error;
  }
  return data;
}

export async function linkPersonalizationToOutreach(contactId, campaignId, personalizationId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('outreach')
    .update({ personalization_id: personalizationId, updated_at: new Date().toISOString() })
    .eq('contact_id', contactId)
    .eq('campaign_id', campaignId)
    .select()
    .maybeSingle();

  if (error) {
    logger.error('Error linking personalization to outreach:', { contactId, campaignId, error: error.message });
    throw error;
  }
  return data;
}

export async function updateOutreachRecord(id, fields) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('outreach')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, contacts(*)')
    .single();

  if (error) {
    logger.error(`Error updating outreach record ${id}:`, { error: error.message });
    throw error;
  }

  return data;
}

export async function resetStaleClaims(timeoutMinutes = 10) {
  const supabase = getSupabaseClient();
  const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('outreach')
    .update({
      status: 'Ready',
      claim_id: null,
      claimed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('status', 'Claimed')
    .lte('claimed_at', cutoff)
    .select();

  if (error) {
    logger.error('Error resetting stale claims:', { error: error.message });
  } else if (data && data.length > 0) {
    logger.info(`Reset ${data.length} stale claimed records back to Ready`);
  }
}

export async function isGmailMessageProcessed(messageId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('processed_gmail_messages')
    .select('message_id')
    .eq('message_id', messageId)
    .maybeSingle();

  if (error) {
    logger.error('Error checking processed message ID:', { error: error.message });
    return false;
  }
  return Boolean(data);
}

export async function markGmailMessageProcessed(messageId) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('processed_gmail_messages')
    .upsert({ message_id: messageId, processed_at: new Date().toISOString() });

  if (error) {
    logger.error('Error marking Gmail message as processed:', { error: error.message });
  }
}

export async function findOutreachByGmailThreadId(threadId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('outreach')
    .select('*, contacts(*)')
    .eq('gmail_thread_id', threadId)
    .maybeSingle();

  if (error) {
    logger.error('Error finding outreach by thread ID:', { error: error.message });
    return null;
  }
  return data;
}
