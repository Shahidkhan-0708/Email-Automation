import { config } from './src/config/env.js';
import { logger } from './src/utils/logger.js';
import { renderEmailTemplate, generateUnsubscribeUrl } from './src/utils/template-engine.js';
import { classifyReply } from './src/integrations/ai/classifier.js';
import { extractEmailAddress, extractPlainTextBody } from './src/utils/email-parser.js';
import { extractRows, normalizeRows } from './src/services/import.service.js';
import { buildPrompt } from './src/services/personalization.service.js';
import jwt from 'jsonwebtoken';
import * as XLSX from 'xlsx';

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

  console.log('\n--- 5. Testing Import Parsers (CSV & XLSX) ---');
  const csvBuffer = Buffer.from(
    'Name,Email,Organization,Role\n' +
    'Dr. Ayesha Khan,ayesha.khan@example.edu,Example University,Professor\n' +
    'Rahul Verma,rahul.verma@example.org,Example Labs,Researcher\n'
  );
  const csvRows = await extractRows(csvBuffer, 'csv');
  console.log(`CSV parsed ${csvRows.length} rows`);
  console.log('CSV Row 1:', JSON.stringify(csvRows[0]));
  if (csvRows.length !== 2 || csvRows[0].email !== 'ayesha.khan@example.edu') {
    throw new Error('CSV parsing verification failed');
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet([
    { 'Full Name': 'Dr. Sarah Rao', 'Email Address': 'sarah.rao@xyz.edu', 'Title': 'Professor' },
    { 'Full Name': 'Vikram Singh', 'Email Address': 'vikram.singh@xyz.edu', 'Title': 'Dean' },
  ]);
  XLSX.utils.book_append_sheet(wb, ws, 'Leads');
  const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const xlsxRows = await extractRows(xlsxBuffer, 'xlsx');
  console.log(`XLSX parsed ${xlsxRows.length} rows`);
  console.log('XLSX Row 1:', JSON.stringify(xlsxRows[0]));
  if (xlsxRows.length !== 2 || xlsxRows[0].email !== 'sarah.rao@xyz.edu' || xlsxRows[0].role !== 'Professor') {
    throw new Error('XLSX parsing verification failed');
  }

  console.log('\n--- 6. Testing Personalization Prompt Builder ---');
  const prompt = buildPrompt(
    { full_name: 'Dr. Ayesha Khan', organization: 'Example University', role: 'Professor' },
    [
      { relationship: 'publication', fact_value: 'AI ethics paper 2024', source_id: 'academic_db', confidence: 0.92, verified: true },
    ],
    { name: 'College Outreach Initiative', description: 'Default campaign' },
    { fromName: 'Shahid', fromEmail: 'shahid@gmail.com' }
  );
  if (!prompt.includes('AI ethics paper 2024') || !prompt.includes('academic_db') || !prompt.includes('College Outreach Initiative')) {
    throw new Error('Prompt builder verification failed');
  }
  console.log(`Prompt built (${prompt.length} chars) and includes facts + campaign context.`);

  console.log('\n--- VERIFICATION COMPLETED SUCCESSFULLY ---');
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
