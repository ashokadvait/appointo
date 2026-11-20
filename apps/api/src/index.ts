import { createApp } from './app';

const app = createApp();

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Dedicated Calendly API running at: http://localhost:${PORT}`);
    console.log(`📡 Healthcheck:                       http://localhost:${PORT}/health`);
    console.log(`🔑 Master API:                        http://localhost:${PORT}/api`);
    console.log(`======================================================\n`);
  });
}

export default app;
