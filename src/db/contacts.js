import { getSupabaseClient } from './client.js';
import { logger } from '../utils/logger.js';

export async function findContactByEmail(email) {
  const supabase = getSupabaseClient();
  const normalized = email.toLowerCase().trim();
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('email', normalized)
    .maybeSingle();

  if (error) {
    logger.error('Error finding contact by email:', { email, error: error.message });
    throw error;
  }
  return data;
}

export async function createOrUpdateContact(contactData) {
  const supabase = getSupabaseClient();
  const normalized = {
    ...contactData,
    email: contactData.email.toLowerCase().trim(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('contacts')
    .upsert(normalized, { onConflict: 'email' })
    .select()
    .single();

  if (error) {
    logger.error('Error upserting contact:', { email: contactData.email, error: error.message });
    throw error;
  }
  return data;
}

export async function approveContactPersonalization(contactId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('contacts')
    .update({
      personalization_approved: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contactId)
    .select()
    .single();

  if (error) {
    logger.error('Error approving contact personalization:', { contactId, error: error.message });
    throw error;
  }
  return data;
}

export async function markContactSuppressed(email, reason = 'bounced') {
  const supabase = getSupabaseClient();
  const normalized = email.toLowerCase().trim();
  const { data, error } = await supabase
    .from('contacts')
    .update({
      suppressed: true,
      do_not_contact: true,
      suppression_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('email', normalized)
    .select();

  if (error) {
    logger.error('Error suppressing contact:', { email, error: error.message });
    throw error;
  }
  return data;
}
