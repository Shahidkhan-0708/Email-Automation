import cron from 'node-cron';
import { syncSupabaseToAirtable } from '../integrations/airtable/sync.js';
import { logger } from '../utils/logger.js';

export function scheduleAirtableSyncJob() {
  // Every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    logger.info('Cron trigger: Syncing Supabase state to Airtable dashboard...');
    try {
      await syncSupabaseToAirtable();
    } catch (err) {
      logger.error('Error in Airtable sync cron job:', { error: err.message });
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata',
  });
  logger.info('Scheduled job: Airtable Dashboard Sync (Every 30 min)');
}
