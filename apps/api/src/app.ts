import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import router from './routes';

const INTERNAL_ERROR_PATTERNS = [
  /prisma/i,
  /schema\.prisma/i,
  /Environment variable not found/i,
  /Can't reach database/i,
  /ECONNREFUSED/i,
  /Validation Error Count/i,
  /Invalid `.*` invocation/i,
];

function sanitizeErrorMessage(message: unknown, statusCode: number): string {
  if (typeof message !== 'string' || !message.trim()) {
    return statusCode >= 500
      ? 'Something went wrong. Please try again later.'
      : 'Request could not be completed. Please try again.';
  }
  if (INTERNAL_ERROR_PATTERNS.some((pattern) => pattern.test(message))) {
    return 'Service is temporarily unavailable. Please try again in a moment.';
  }
  return message;
}

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());

  // Sanitize internal/database error details before sending responses to clients
  app.use((_req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    res.json = ((body: any) => {
      if (res.statusCode >= 400 && body && typeof body === 'object' && 'error' in body) {
        const sanitized = sanitizeErrorMessage(body.error, res.statusCode);
        if (sanitized !== body.error) {
          console.error('[API Error]', body.error);
          return originalJson({ ...body, error: sanitized });
        }
      }
      return originalJson(body);
    }) as Response['json'];
    next();
  });

  // Healthcheck
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Mount API master router
  app.use('/api', router);

  return app;
}
