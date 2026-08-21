import { google } from 'googleapis';
import { config } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { extractEmailAddress, extractPlainTextBody } from '../../utils/email-parser.js';

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    config.gmail.clientId,
    config.gmail.clientSecret,
    config.gmail.redirectUri
  );
}

export function generateAuthUrl() {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
    ],
  });
}

export async function exchangeCodeForTokens(code) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export function getAuthenticatedGmailClient() {
  const oauth2Client = getOAuth2Client();
  if (config.gmail.refreshToken) {
    oauth2Client.setCredentials({ refresh_token: config.gmail.refreshToken });
  } else {
    logger.warn('GMAIL_REFRESH_TOKEN is missing in env. Gmail API calls may fail until authorized.');
  }
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

export async function getRecentReplies(afterTimestampDate = null) {
  try {
    const gmail = getAuthenticatedGmailClient();

    // Convert date to epoch seconds for Gmail search query if provided
    let query = 'is:inbox';
    if (afterTimestampDate) {
      const epochSeconds = Math.floor(new Date(afterTimestampDate).getTime() / 1000);
      query += ` after:${epochSeconds}`;
    }

    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 50,
    });

    const messages = listRes.data.messages || [];
    if (messages.length === 0) return [];

    const replyDetails = [];

    for (const msgSummary of messages) {
      const msgRes = await gmail.users.messages.get({
        userId: 'me',
        id: msgSummary.id,
        format: 'full',
      });

      const messageData = msgRes.data;
      const headers = messageData.payload?.headers || [];

      const fromHeader = headers.find(h => h.name.toLowerCase() === 'from')?.value || '';
      const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '';
      const dateHeader = headers.find(h => h.name.toLowerCase() === 'date')?.value || '';

      const senderEmail = extractEmailAddress(fromHeader);
      const inReplyTo = headers.find(h => h.name.toLowerCase() === 'in-reply-to')?.value || '';
      const bodyText = extractPlainTextBody(messageData.payload);

      replyDetails.push({
        id: messageData.id,
        threadId: messageData.threadId,
        fromEmail: senderEmail,
        rawFrom: fromHeader,
        subject: subjectHeader,
        receivedAt: dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString(),
        body: bodyText,
        inReplyTo,
      });
    }

    return replyDetails;
  } catch (err) {
    logger.error('Error fetching recent Gmail replies:', { error: err.message });
    return [];
  }
}

export async function testGmail(req, res) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      config.gmail.clientId,
      config.gmail.clientSecret,
      config.gmail.redirectUri
    );

    oauth2Client.setCredentials({
      refresh_token: config.gmail.refreshToken
    });

    const gmail = google.gmail({
      version: 'v1',
      auth: oauth2Client
    });

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10
    });

    res.json({
      success: true,
      messages: response.data.messages || [],
      resultSizeEstimate: response.data.resultSizeEstimate || 0
    });

  } catch (error) {
    logger.error('Gmail API test failed:', { error: error.message });

    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data || null
    });
  }
}

