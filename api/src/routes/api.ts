import { Router } from 'express';
import { ByondTopic } from '../lib/topic.js';

const STATUS_FIELDS = ['players', 'popcap', 'map_name'] as const;

export const apiRouter = Router();

function readGameConfig(): { host: string; port: number } {
  const port = Number(process.env.GAME_PORT ?? 1338);
  return {
    host: process.env.GAME_HOST ?? 'game.blastwave.space',
    port: Number.isFinite(port) && port > 0 ? port : 1338,
  };
}

function pickStatus(params: URLSearchParams): Record<string, string> {
  const status: Record<string, string> = {};
  for (const field of STATUS_FIELDS) {
    const value = params.get(field);
    if (value != null) {
      status[field] = value;
    }
  }
  return status;
}

apiRouter.get('/', (_req, res) => {
  res.json({
    name: 'blastwave-api',
    version: '0.0.0',
  });
});

apiRouter.get('/status', async (_req, res) => {
  const { host, port } = readGameConfig();
  try {
    const tres = await ByondTopic(host, port, 'status');
    if (typeof tres !== 'string') {
      res.status(502).json({ error: true });
      return;
    }
    res.json(pickStatus(new URLSearchParams(tres)));
  } catch {
    res.status(502).json({ error: true });
  }
});
