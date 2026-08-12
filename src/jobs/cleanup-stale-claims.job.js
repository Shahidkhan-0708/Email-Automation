import cron from 'node-cron';
import { resetStaleClaims } from '../db/outreach.js';
import { logger } from '../utils/logger.js';

export function scheduleCleanupStaleClaimsJob() {
  // Every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      await resetStaleClaims(10);
    } catch (err) {
      logger.error('Error in cleanup stale claims cron job:', { error: err.message });
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata',
  });
  logger.info('Scheduled job: Stale Claim Sweeper (Every 5 min)');
}
