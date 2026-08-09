import { Router, type RequestHandler } from 'express';
import type { SkuMiddleware } from 'sku/runtime';

// eslint-disable-next-line new-cap
const fixtureApi = Router();

fixtureApi.get('/api/health', (_req, res) => {
  res.status(200).type('text/plain').send('ok');
});

fixtureApi.get('/api/user', (req, res) => {
  res
    .status(200)
    .type('text/plain')
    .send(req.skuUserId ?? '');
});

const userIdMiddleware: RequestHandler = (req, _res, next) => {
  req.skuUserId = 'fixture-user';
  next();
};

export const middleware: SkuMiddleware = [userIdMiddleware, fixtureApi];
