import type { Express, RequestHandler, Response } from 'express';

type ReadinessState = 'starting' | 'ready' | 'draining';

const PROBE_HEADERS = {
  'Cache-Control': 'no-store',
  'Content-Type': 'text/plain; charset=utf-8',
} as const;

/** Signals that take `/readyz` out of rotation. Production drains on these. */
export const PROBE_DRAIN_SIGNALS = ['SIGTERM', 'SIGINT'] as const;

const sendProbe = (res: Response, status: number, body: string) => {
  res.set(PROBE_HEADERS);
  res.status(status).send(body);
};

/**
 * Sku-owned `/livez` and `/readyz`, mounted ahead of request context, static
 * files, Vite, dev server middleware, app middleware, and HTML.
 *
 * `/livez` is 200 whenever this handler runs: that means the process and HTTP
 * event loop can respond. It does no I/O. A stuck event loop fails the probe
 * by timeout, which this process cannot report as 503. `/livez` stays 200
 * while draining.
 *
 * `/readyz` is 503 until `markReady` (after listen and `onListen`), then 200
 * until `markDraining`. There is no app callback.
 */
export const createProbeMiddleware = (): {
  livez: RequestHandler;
  readyz: RequestHandler;
  methodNotAllowed: RequestHandler;
  markReady: () => void;
  markDraining: () => void;
} => {
  let state: ReadinessState = 'starting';

  const transition = (next: ReadinessState) => {
    if (state === next || state === 'draining') {
      return;
    }
    const previous = state;
    state = next;
    console.info(`readiness ${previous} -> ${next}`);
  };

  const livez: RequestHandler = (_req, res) => {
    sendProbe(res, 200, 'ok');
  };

  const readyz: RequestHandler = (_req, res) => {
    if (state === 'ready') {
      sendProbe(res, 200, 'ok');
      return;
    }
    sendProbe(res, 503, 'unavailable');
  };

  const methodNotAllowed: RequestHandler = (_req, res) => {
    res.set(PROBE_HEADERS);
    res.set('Allow', 'GET, HEAD');
    res.status(405).end();
  };

  return {
    livez,
    readyz,
    methodNotAllowed,
    markReady: () => {
      transition('ready');
    },
    markDraining: () => {
      transition('draining');
    },
  };
};

export const mountProbeRoutes = (
  app: Express,
  probes: {
    livez: RequestHandler;
    readyz: RequestHandler;
    methodNotAllowed: RequestHandler;
  },
) => {
  app.get('/livez', probes.livez);
  app.all('/livez', probes.methodNotAllowed);
  app.get('/readyz', probes.readyz);
  app.all('/readyz', probes.methodNotAllowed);
};

/**
 * Marks `/readyz` draining on SIGTERM and SIGINT.
 * When this handler is the only listener, it removes itself and re-raises so
 * Node still exits `sku start`. Production shutdown owns these signals itself
 * and must not use this helper.
 */
export const bindProbeDrainSignals = (markDraining: () => void) => {
  const handlers = PROBE_DRAIN_SIGNALS.map((signal) => {
    const handler = () => {
      markDraining();
      if (process.listenerCount(signal) === 1) {
        process.removeListener(signal, handler);
        process.kill(process.pid, signal);
      }
    };
    process.on(signal, handler);
    return { signal, handler };
  });

  return () => {
    for (const { signal, handler } of handlers) {
      process.removeListener(signal, handler);
    }
  };
};
