declare module 'express-serve-static-core' {
  interface Request {
    /** Fixture middleware attaches an isomorphic-capable user id (not raw `req`). */
    skuUserId?: string;
    /** Set by configMiddleware — app-owned site selection. */
    site?: 'au' | 'nz';
    /** Set by configMiddleware — vocab language from pathname. */
    language?: 'en' | 'fr';
  }
}

export {};
