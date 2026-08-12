import nodemailer from 'nodemailer';
import { config } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }
  return transporter;
}

export async function sendEmail({ toEmail, toName, subject, html, text, replyTo }) {
  const mailOptions = {
    from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
    to: toName ? `"${toName}" <${toEmail}>` : toEmail,
    subject,
    html,
    text,
    replyTo: replyTo || config.smtp.fromEmail,
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);
    logger.info(`Email sent successfully to ${toEmail}`, { messageId: info.messageId });
    return {
      success: true,
      messageId: info.messageId || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      response: info.response,
    };
  } catch (err) {
    const errorCategory = categorizeSmtpError(err);
    logger.error(`Failed sending email to ${toEmail}:`, {
      error: err.message,
      category: errorCategory,
      code: err.code,
    });
    throw {
      message: err.message,
      category: errorCategory,
      code: err.code,
    };
  }
}

function categorizeSmtpError(err) {
  const msg = (err.message || '').toLowerCase();
  const code = err.code || '';

  if (msg.includes('rate limit') || msg.includes('too many') || code === 'EPROTOCOL') {
    return 'rate_limit';
  }
  if (msg.includes('recipient rejected') || msg.includes('does not exist') || msg.includes('550') || msg.includes('invalid address')) {
    return 'invalid_email';
  }
  if (msg.includes('authentication failed') || msg.includes('535') || code === 'EAUTH') {
    return 'auth_error';
  }
  if (msg.includes('timeout') || msg.includes('connection error') || code === 'ETIMEDOUT') {
    return 'provider_error';
  }
  return 'provider_error';
}
