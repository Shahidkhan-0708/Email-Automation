import cron from 'node-cron';
import { processFollowUpsBatch } from '../services/followup.service.js';
import { logger } from '../utils/logger.js';

export function scheduleFollowUpJob() {
  // Daily at 10:00 Asia/Kolkata
  cron.schedule('0 10 * * *', async () => {
    logger.info('Cron trigger: Starting daily follow-ups job...');
    try {
      await processFollowUpsBatch();
    } catch (err) {
      logger.error('Unhandled error in follow-up cron job:', { error: err.message });
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata',
  });
  logger.info('Scheduled job: Follow-ups (10:00 IST daily)');
}
