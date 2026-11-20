import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import router from './routes';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());

  // Healthcheck
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Mount API master router
  app.use('/api', router);

  return app;
}
