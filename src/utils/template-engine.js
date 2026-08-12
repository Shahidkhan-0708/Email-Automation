import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { logger } from './logger.js';

const templatesDir = path.resolve(process.cwd(), 'src/templates');

function loadTemplate(filename) {
  const filePath = path.join(templatesDir, filename);
  try {
    const source = fs.readFileSync(filePath, 'utf-8');
    return handlebars.compile(source);
  } catch (err) {
    logger.warn(`Failed to load template file ${filePath}, falling back to basic compiler`, { error: err.message });
    return (data) => `Hi ${data.firstName || 'there'},\n\nWe would love to connect regarding our college initiative.\n\nBest,\n${data.senderName}`;
  }
}

const compiledTemplates = {
  initial: loadTemplate('initial.hbs'),
  followup1: loadTemplate('followup-1.hbs'),
  followup2: loadTemplate('followup-2.hbs'),
};

export function generateUnsubscribeUrl(contactId) {
  const token = jwt.sign({ contactId }, config.security.unsubscribeJwtSecret, { expiresIn: '90d' });
  return `${config.baseUrl}/unsubscribe?token=${token}`;
}

export function renderEmailTemplate(templateName, data) {
  const compiler = compiledTemplates[templateName] || compiledTemplates.initial;
  const unsubscribeUrl = generateUnsubscribeUrl(data.contactId);
  const templateData = { ...data, unsubscribeUrl };
  
  const htmlBody = compiler(templateData);
  
  const textBody = htmlBody
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .trim();

  return {
    subject: data.subject || `Connecting with ${data.organization || 'your team'}`,
    html: htmlBody,
    text: textBody,
    unsubscribeUrl,
  };
}
