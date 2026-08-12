import { config } from './src/config/env.js';
import { logger } from './src/utils/logger.js';
import { renderEmailTemplate, generateUnsubscribeUrl } from './src/utils/template-engine.js';
import { classifyReply } from './src/integrations/ai/classifier.js';
import { extractEmailAddress, extractPlainTextBody } from './src/utils/email-parser.js';
import jwt from 'jsonwebtoken';

async function runVerification() {
  console.log('--- 1. Testing Config Loading ---');
  console.log(`Port: ${config.port}`);
  console.log(`Default Daily Limit: ${config.outreach.dailySendLimit}`);
  console.log(`Sender: ${config.smtp.fromName} <${config.smtp.fromEmail}>`);

  console.log('\n--- 2. Testing Email Template Engine & Unsubscribe Link ---');
  const templateResult = renderEmailTemplate('initial', {
    contactId: '12345-uuid-test',
    firstName: 'Dr. Sarah',
    organization: 'XYZ University',
    role: 'Professor',
    personalization: 'Research on multimodal AI architectures',
    senderName: config.smtp.fromName,
    subject: 'Connecting regarding AI research initiative',
  });

  console.log(`Subject: ${templateResult.subject}`);
  console.log(`Unsubscribe URL: ${templateResult.unsubscribeUrl}`);
  console.log(`HTML Preview:\n${templateResult.html.slice(0, 300)}...`);

  // Verify JWT token decoding
  const urlObj = new URL(templateResult.unsubscribeUrl);
  const token = urlObj.searchParams.get('token');
  const decoded = jwt.verify(token, config.security.unsubscribeJwtSecret);
  console.log(`Decoded Unsubscribe JWT Contact ID: ${decoded.contactId}`);

  console.log('\n--- 3. Testing AI Classifier (Structured Output) ---');
  const sampleReply = "Thanks for reaching out! I'd be very interested in joining your AI initiative. Can you send over available meeting times for next week?";
  const classification = await classifyReply(sampleReply);
  console.log('Classification Result:');
  console.log(JSON.stringify(classification, null, 2));

  console.log('\n--- 4. Testing Email Parser ---');
  const parsedHeader = extractEmailAddress('Dr. Sarah Rao <sarah.rao@xyz.edu>');
  console.log(`Extracted Header Email: ${parsedHeader}`);

  console.log('\n--- VERIFICATION COMPLETED SUCCESSFULLY ---');
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
