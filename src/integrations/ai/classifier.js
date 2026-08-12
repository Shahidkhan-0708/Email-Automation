import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { config } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

let openaiClient = null;

function getOpenAIClient() {
  if (!openaiClient) {
    if (!config.ai.apiKey || config.ai.apiKey.includes('mock')) {
      logger.warn('OPENAI_API_KEY missing or set to mock. AI classifier will use mock responses.');
      return null;
    }
    openaiClient = new OpenAI({ apiKey: config.ai.apiKey });
  }
  return openaiClient;
}

const ClassificationSchema = z.object({
  category: z.enum([
    'INTERESTED',
    'NOT_INTERESTED',
    'MEETING_REQUEST',
    'QUESTION',
    'FOLLOW_UP_LATER',
    'OUT_OF_OFFICE',
    'OTHER',
  ]),
  confidence: z.number().min(0).max(1),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  summary: z.string(),
  nextAction: z.string(),
  suggestedFollowUpDate: z.string().nullable(),
  requiresHumanReview: z.boolean(),
});

export async function classifyReply(replyText) {
  const client = getOpenAIClient();

  if (!client) {
    return getMockClassification(replyText);
  }

  try {
    const completion = await client.chat.completions.parse({
      model: config.ai.model,
      messages: [
        {
          role: 'system',
          content: `You are an expert AI outreach assistant classifying responses to university student initiative emails.
Analyse the reply text carefully and produce structured output matching the schema.
Guidelines:
- category MUST be one of: INTERESTED, NOT_INTERESTED, MEETING_REQUEST, QUESTION, FOLLOW_UP_LATER, OUT_OF_OFFICE, OTHER.
- set requiresHumanReview=true for MEETING_REQUEST, QUESTION, low confidence (<0.8), or any nuanced request.
- only set suggestedFollowUpDate (YYYY-MM-DD) if an explicit date or timeline is mentioned in the reply.
- do NOT invent dates.`,
        },
        {
          role: 'user',
          content: replyText,
        },
      ],
      response_format: zodResponseFormat(ClassificationSchema, 'classification'),
    });

    const parsed = completion.choices[0].message.parsed;
    logger.info('AI reply classification completed', { category: parsed.category, confidence: parsed.confidence });
    return parsed;
  } catch (err) {
    logger.error('Error during AI reply classification:', { error: err.message });
    return getMockClassification(replyText, err.message);
  }
}

function getMockClassification(text, errorMsg = null) {
  const lower = text.toLowerCase();
  let category = 'OTHER';
  let nextAction = 'Review reply manually.';
  let sentiment = 'neutral';

  if (lower.includes('meet') || lower.includes('date') || lower.includes('time') || lower.includes('schedule')) {
    category = 'MEETING_REQUEST';
    nextAction = 'Send available meeting dates.';
    sentiment = 'positive';
  } else if (lower.includes('interested') || lower.includes('sounds good') || lower.includes('love to')) {
    category = 'INTERESTED';
    nextAction = 'Send program details.';
    sentiment = 'positive';
  } else if (lower.includes('unsubscribe') || lower.includes('not interested') || lower.includes('remove')) {
    category = 'NOT_INTERESTED';
    nextAction = 'Mark lead as closed / do not contact.';
    sentiment = 'negative';
  } else if (lower.includes('out of office') || lower.includes('vacation') || lower.includes('ooo')) {
    category = 'OUT_OF_OFFICE';
    nextAction = 'Check back after return date.';
    sentiment = 'neutral';
  }

  return {
    category,
    confidence: 0.85,
    sentiment,
    summary: `Recipient wrote: "${text.slice(0, 100)}${text.length > 100 ? '...' : ''}"`,
    nextAction,
    suggestedFollowUpDate: null,
    requiresHumanReview: true,
    ...(errorMsg ? { errorMsg } : {}),
  };
}
