import cron from 'node-cron';
import { processIncomingReplies } from '../services/reply.service.js';
import { logger } from '../utils/logger.js';

export function scheduleReplyCheckJob() {
  // Every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    logger.info('Cron trigger: Starting Gmail reply check job...');
    try {
      await processIncomingReplies();
    } catch (err) {
      logger.error('Unhandled error in reply check cron job:', { error: err.message });
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata',
  });
  logger.info('Scheduled job: Reply Detection (Every 15 min)');
}
