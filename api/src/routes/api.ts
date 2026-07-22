import { Router } from 'express';
import { ByondTopic } from '../lib/topic.js'

export const apiRouter = Router();

apiRouter.get('/', (_req, res) => {
  res.json({
    name: 'blastwave-api',
    version: '0.0.0',
  });
});


apiRouter.get('/status', (_req, res) => {
  res.header('Access-Control-Allow-Origin', '*'); 
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  ByondTopic(process.env.API_SERVER || 'game.blastwave.space', parseInt(process.env.API_PORT || "1338", 10), "status")
    .then((tres : string | number) => {
      if (typeof tres != 'string') {
        res.status(400).json({error: true, msg: 'internal error: tres should be string'})
        return
      }
      const params = new URLSearchParams(tres);
      const obj = Object.fromEntries(params);
      res.json(obj);
    })
    .catch((err : Error) => {
      res.status(400).json({error: true, msg: err.message})
    })
})
