import type { Request as ExpressRequest } from 'express-serve-static-core';

type FixtureLanguage = 'en' | 'fr';

export const languageFromPath = (pathname: string): FixtureLanguage =>
  pathname === '/fr' || pathname.startsWith('/fr/') ? 'fr' : 'en';

export const configMiddleware = (
  req: ExpressRequest,
  _res: unknown,
  next: (err?: unknown) => void,
) => {
  const header = req.get('x-sku-site');
  req.site = header === 'nz' || header === 'au' ? header : 'au';
  req.language = languageFromPath(req.path);
  next();
};

type Site = 'nz' | 'au';

export const getSite = ({ req }: { req: ExpressRequest }): Site =>
  req.site === 'nz' ? 'nz' : 'au';

type Language = 'fr' | 'en';

export const getLanguage = ({ req }: { req: ExpressRequest }): Language =>
  req.language === 'fr' ? 'fr' : 'en';
