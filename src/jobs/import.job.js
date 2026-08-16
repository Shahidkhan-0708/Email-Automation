import cron from 'node-cron';
import { getNextQueuedImportJob } from '../db/import-jobs.js';
import { processImportJob } from '../services/import.service.js';
import { logger } from '../utils/logger.js';

export function scheduleImportJob() {
  // Process queued imports every 2 minutes, one at a time
  cron.schedule('*/2 * * * *', async () => {
    try {
      const job = await getNextQueuedImportJob();
      if (!job) return;
      logger.info(`Cron trigger: Processing queued import job ${job.id} (${job.filename})`);
      await processImportJob(job.id);
    } catch (err) {
      logger.error('Unhandled error in import cron job:', { error: err.message });
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata',
  });
  logger.info('Scheduled job: Import Processing (every 2 minutes)');
}
