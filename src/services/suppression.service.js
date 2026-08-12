import { logger } from '../utils/logger.js';
import { markContactSuppressed } from '../db/contacts.js';
import { getSupabaseClient } from '../db/client.js';

export async function handleNormalizedEmailEvent(event) {
  const { type, email, messageId, reason, timestamp } = event;

  logger.info(`Handling email event: ${type} for email: ${email}`, { messageId, reason });

  const supabase = getSupabaseClient();
  const normalizedEmail = (email || '').toLowerCase().trim();

  switch (type) {
    case 'BOUNCED':
      if (normalizedEmail) {
        await markContactSuppressed(normalizedEmail, `Hard bounce: ${reason || '550 recipient rejected'}`);
      }
      if (messageId) {
        await supabase
          .from('outreach')
          .update({ delivery_status: 'Bounced', bounce_reason: reason || 'Hard bounce', updated_at: new Date().toISOString() })
          .eq('provider_message_id', messageId);
      }
      break;

    case 'DELIVERED':
      if (messageId) {
        await supabase
          .from('outreach')
          .update({ delivery_status: 'Delivered', updated_at: new Date().toISOString() })
          .eq('provider_message_id', messageId);
      }
      break;

    case 'UNSUBSCRIBED':
    case 'COMPLAINT':
      if (normalizedEmail) {
        await markContactSuppressed(normalizedEmail, `Opted out via ${type.toLowerCase()}`);
      }
      break;

    case 'FAILED':
      if (messageId) {
        await supabase
          .from('outreach')
          .update({ delivery_status: 'Failed', error_message: reason || 'Delivery failed', updated_at: new Date().toISOString() })
          .eq('provider_message_id', messageId);
      }
      break;

    default:
      logger.warn(`Unknown email event type: ${type}`);
  }
}
