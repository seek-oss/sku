declare module 'express-serve-static-core' {
  interface Request {
    /** Set by configMiddleware — app-owned site selection. */
    site?: 'au' | 'nz';
  }
}

export {};
