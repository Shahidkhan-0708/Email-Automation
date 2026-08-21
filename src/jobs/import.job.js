import cron from 'node-cron';
import { getNextQueuedImportJob, recoverStaleImportJobs } from '../db/import-jobs.js';
import { processImportJob } from '../services/import.service.js';
import { logger } from '../utils/logger.js';

export function scheduleImportJob() {
  // Process queued imports every 2 minutes, one at a time
  cron.schedule('*/2 * * * *', async () => {
    try {
      // Recover jobs left in 'processing' by a crashed run before looking for
      // new work, so imports are never permanently stuck.
      await recoverStaleImportJobs(10);
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
