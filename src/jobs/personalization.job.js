import cron from 'node-cron';
import { processPendingPersonalizations } from '../services/personalization.service.js';
import { logger } from '../utils/logger.js';

export function schedulePersonalizationJob() {
  // Generate personalizations for ready profiles every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    logger.info('Cron trigger: Running personalization generation batch...');
    try {
      await processPendingPersonalizations(null, 20);
    } catch (err) {
      logger.error('Unhandled error in personalization cron job:', { error: err.message });
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata',
  });
  logger.info('Scheduled job: Personalization Generation (every 5 minutes)');
}
