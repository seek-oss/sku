import { Router } from 'express';
import type { SkuMiddleware } from 'sku/runtime';

// eslint-disable-next-line new-cap
const fixtureApi = Router();

fixtureApi.get('/api/nonce', (req, res) => {
  res
    .status(200)
    .type('text/plain')
    .send(req.getCspNonce?.() ?? '');
});

export const middleware: SkuMiddleware = [fixtureApi];
