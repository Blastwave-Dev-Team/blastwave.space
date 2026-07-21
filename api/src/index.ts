import express from 'express';
import { apiRouter } from './routes/api.js';

type EnvConfig = {
  host: string;
  port: number;
};

function readConfig(): EnvConfig {
  return {
    host: process.env.HOST ?? '0.0.0.0',
    port: Number(process.env.PORT ?? 3002),
  };
}

function main(): void {
  const config = readConfig();
  const app = express();

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api', apiRouter);

  app.listen(config.port, config.host, () => {
    console.log(`blastwave-api listening on ${config.host}:${config.port}`);
  });
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
