declare module 'express-serve-static-core' {
  interface Request {
    /** Fixture middleware attaches an isomorphic-capable user id (not raw `req`). */
    skuUserId?: string;
  }
}

export {};
