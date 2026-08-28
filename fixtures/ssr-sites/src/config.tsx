import type { Request as ExpressRequest } from 'express-serve-static-core';

export const configMiddleware = (
  req: ExpressRequest,
  _res: unknown,
  next: (err?: unknown) => void,
) => {
  const header = req.get('x-sku-site');
  req.site = header === 'nz' || header === 'au' ? header : 'au';
  next();
};

type Site = 'nz' | 'au';

export const getSite = ({ req }: { req: ExpressRequest }): Site =>
  req.site === 'nz' ? 'nz' : 'au';
