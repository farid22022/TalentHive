import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { config } from './config/index.js';
import { logger } from './config/logger.js';
import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middlewares/error.js';
import { apiLimiter } from './middlewares/rateLimit.js';
import healthRoutes from './routes/health.routes.js';
import crypto from 'node:crypto';
import { recordRequest } from './config/metrics.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: config.clientUrl,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use((req, res, next) => { const requestId = req.get('X-Request-Id') || `req_${crypto.randomUUID()}`; req.requestId = requestId; res.setHeader('X-Request-Id', requestId); const started = Date.now(); res.on('finish', () => recordRequest(res.statusCode, Date.now() - started)); next(); });
  app.use(pinoHttp({ logger, autoLogging: !config.isProd }));

  app.use(healthRoutes);

  app.use('/api', apiLimiter, apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
