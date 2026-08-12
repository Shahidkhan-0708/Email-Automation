import cron from 'node-cron';
import { processOutreachBatch } from '../services/outreach.service.js';
import { logger } from '../utils/logger.js';

export function scheduleOutreachJob() {
  // Daily at 09:00 Asia/Kolkata
  cron.schedule('0 9 * * *', async () => {
    logger.info('Cron trigger: Starting daily outreach send job...');
    try {
      await processOutreachBatch();
    } catch (err) {
      logger.error('Unhandled error in outreach cron job:', { error: err.message });
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata',
  });
  logger.info('Scheduled job: Outreach Send (09:00 IST daily)');
}
