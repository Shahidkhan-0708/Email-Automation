import express from 'express';
import { handleNormalizedEmailEvent } from '../services/suppression.service.js';
import { logger } from '../utils/logger.js';

export const webhookRouter = express.Router();

webhookRouter.post('/email-events', express.json(), async (req, res) => {
  try {
    const payload = req.body;
    const normalized = normalizeWebhookPayload(payload);

    if (normalized && normalized.length > 0) {
      for (const event of normalized) {
        await handleNormalizedEmailEvent(event);
      }
    }

    res.status(200).json({ status: 'received' });
  } catch (err) {
    logger.error('Error processing email event webhook:', { error: err.message });
    res.status(500).json({ error: 'Webhook processing error' });
  }
});

function normalizeWebhookPayload(body) {
  if (!body) return [];

  // Generic / Custom Webhook format
  if (body.type && (body.email || body.messageId)) {
    return [{
      type: (body.type || 'DELIVERED').toUpperCase(),
      email: body.email,
      messageId: body.messageId,
      reason: body.reason || body.error,
      timestamp: body.timestamp || new Date().toISOString(),
    }];
  }

  // Mailjet webhook event format array
  if (Array.isArray(body)) {
    return body.map((evt) => {
      let type = 'DELIVERED';
      if (evt.event === 'bounce' || evt.event === 'blocked') type = 'BOUNCED';
      if (evt.event === 'unsub') type = 'UNSUBSCRIBED';
      if (evt.event === 'spam') type = 'COMPLAINT';

      return {
        type,
        email: evt.email,
        messageId: String(evt.MessageID || evt.custom_id || ''),
        reason: evt.error || evt.comment || evt.reason || evt.event,
        timestamp: new Date(evt.time * 1000 || Date.now()).toISOString(),
      };
    });
  }

  return [];
}
