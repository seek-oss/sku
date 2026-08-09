import { context, SpanStatusCode, trace } from '@opentelemetry/api';
import { Router, json, type ErrorRequestHandler } from 'express';
import type { SkuMiddleware } from 'sku/runtime';

import {
  clearLogEvents,
  getLogEvents,
  ingestLogEvents,
  log,
  type LogEvent,
} from '../shared/log.js';
import {
  extractContextFromHeaders,
  getTracer,
  type SerializedSpan,
} from '../shared/tracing.js';

import {
  clearRecordedSpans,
  getRecordedSpans,
  ingestSpans,
  shouldTraceHttpPath,
} from './tracing.js';

type Middleware = SkuMiddleware[number];

export const httpTracingMiddleware: Middleware = (req, res, next) => {
  if (!shouldTraceHttpPath(req.path)) {
    next();
    return;
  }

  const parentContext = extractContextFromHeaders(
    req.headers as Record<string, string | string[] | undefined>,
  );
  const span = getTracer().startSpan(
    `HTTP ${req.method} ${req.path}`,
    {
      attributes: {
        'http.method': req.method ?? 'GET',
        'http.route': req.path,
      },
    },
    parentContext,
  );

  context.with(trace.setSpan(parentContext, span), () => {
    res.on('finish', () => {
      span.setAttribute('http.status_code', res.statusCode);
      if (res.statusCode >= 500) {
        span.setStatus({ code: SpanStatusCode.ERROR });
      }
      log.info('http.request', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
      });
      span.end();
    });
    next();
  });
};

const parseJsonError: ErrorRequestHandler = (err, _req, res, next) => {
  if (
    err instanceof SyntaxError ||
    (typeof err === 'object' &&
      err !== null &&
      'type' in err &&
      err.type === 'entity.parse.failed')
  ) {
    res.status(400).type('text/plain').send('invalid json');
    return;
  }
  next(err);
};

// eslint-disable-next-line new-cap
const fixtureApi = Router();

fixtureApi.get('/favicon.ico', (_req, res) => {
  res.status(204).end();
});

fixtureApi.get('/api/logs', (_req, res) => {
  res.status(200).type('application/json').send({ events: getLogEvents() });
});

fixtureApi.post('/api/logs', json(), (req, res) => {
  const body = req.body as unknown;
  const events =
    body &&
    typeof body === 'object' &&
    'events' in body &&
    Array.isArray((body as { events: unknown }).events)
      ? (body as { events: LogEvent[] }).events
      : [];
  ingestLogEvents(events);
  res.status(204).end();
});

fixtureApi.post('/api/logs/clear', (_req, res) => {
  clearLogEvents();
  res.status(204).end();
});

fixtureApi.get('/api/spans', (_req, res) => {
  res.status(200).type('application/json').send({ spans: getRecordedSpans() });
});

fixtureApi.post('/api/spans', json(), (req, res) => {
  const body = req.body as unknown;
  const spans =
    body &&
    typeof body === 'object' &&
    'spans' in body &&
    Array.isArray((body as { spans: unknown }).spans)
      ? (body as { spans: SerializedSpan[] }).spans
      : [];
  ingestSpans(spans);
  res.status(204).end();
});

fixtureApi.post('/api/spans/clear', (_req, res) => {
  clearRecordedSpans();
  res.status(204).end();
});

fixtureApi.get('/api/work', (_req, res) => {
  log.info('api.work', { ok: true });
  res.status(200).type('application/json').send({ ok: true, work: 'done' });
});

fixtureApi.use(parseJsonError);

export const middleware: SkuMiddleware = [httpTracingMiddleware, fixtureApi];
