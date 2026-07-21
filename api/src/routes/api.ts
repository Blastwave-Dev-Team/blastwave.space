import { Router } from 'express';

export const apiRouter = Router();

apiRouter.get('/', (_req, res) => {
  res.json({
    name: 'blastwave-api',
    version: '0.0.0',
  });
});
