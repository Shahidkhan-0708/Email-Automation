import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

export function requireApiKey(req, res, next) {
  if (config.env === 'development' && req.headers['x-bypass-auth'] === 'true') {
    return next();
  }

  const apiKeyHeader = req.headers['x-api-key'] || req.headers['apikey'];
  const authHeader = req.headers['authorization'];
  
  let token = apiKeyHeader;
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  if (!token || token !== config.security.adminApiKey) {
    logger.warn(`Unauthorized API request attempted from IP: ${req.ip}`);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing API key in x-api-key header.',
    });
  }

  next();
}
