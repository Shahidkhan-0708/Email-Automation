import express from 'express';
import multer from 'multer';
import { requireApiKey } from '../middleware/api-key.js';
import { logger } from '../utils/logger.js';
import { queueImport, getImportStatus, getRecentImports, processImportJob } from '../services/import.service.js';

export const importRouter = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const EXT_TO_TYPE = {
  '.csv': 'csv',
  '.xlsx': 'xlsx',
  '.xls': 'xlsx',
  '.pdf': 'pdf',
};

function resolveFileType(filename, bodyType) {
  if (bodyType && ['csv', 'xlsx', 'pdf'].includes(bodyType)) return bodyType;
  const ext = (filename || '').split('.').pop().toLowerCase();
  return EXT_TO_TYPE[`.${ext}`] || null;
}

// POST /api/import - upload a CSV/XLSX/PDF file of leads
importRouter.post('/import', requireApiKey, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Send the file as multipart form field "file".' });
    }

    const fileType = resolveFileType(req.file.originalname, req.body.fileType);
    if (!fileType) {
      return res.status(400).json({ error: 'Unsupported file type. Supported: .csv, .xlsx, .pdf' });
    }

    const job = await queueImport({
      filename: req.file.originalname,
      fileType,
      buffer: req.file.buffer,
    });

    res.status(201).json({ success: true, jobId: job.id, status: job.status });
  } catch (err) {
    logger.error('Error queueing import:', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/import/jobs - recent import jobs
importRouter.get('/import/jobs', requireApiKey, async (req, res) => {
  try {
    const jobs = await getRecentImports(parseInt(req.query.limit, 10) || 20);
    res.json({ success: true, jobs });
  } catch (err) {
    logger.error('Error listing import jobs:', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/import/status/:jobId - status of a single import job
importRouter.get('/import/status/:jobId', requireApiKey, async (req, res) => {
  try {
    const job = await getImportStatus(req.params.jobId);
    res.json({ success: true, job });
  } catch (err) {
    res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message });
  }
});

// POST /api/import/process - manually trigger processing (used by cron or debugging)
importRouter.post('/import/process', requireApiKey, async (req, res) => {
  try {
    const job = await processImportJob(req.body.jobId);
    res.json({ success: true, job });
  } catch (err) {
    logger.error('Error processing import job:', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});
