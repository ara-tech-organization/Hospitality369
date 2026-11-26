const env = require('./config/env');
const { connectDB } = require('./config/db');
const app = require('./app');

async function start() {
  await connectDB();
  const server = app.listen(env.port, () => {
    console.log(`[api] Hospitality369 API listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  const shutdown = (signal) => {
    console.log(`[api] ${signal} received, shutting down`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  console.error('[api] failed to start', err);
  process.exit(1);
});
