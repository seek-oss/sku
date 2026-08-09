import { describe, beforeAll, it, expect } from 'vitest';
import {
  scopeToFixture,
  skipCleanup,
  waitFor,
} from '@sku-private/testing-library';
import { createPage } from '@sku-private/playwright';

const { sku, node } = scopeToFixture('logging');

/** @opentelemetry/api SpanStatusCode.ERROR */
const SPAN_STATUS_ERROR = 2;

const baseUrl = 'http://127.0.0.1:8212';

type LogEvent = {
  level: string;
  event: string;
  traceId?: string;
  [key: string]: unknown;
};

type SerializedSpan = {
  name: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  statusCode: number;
  attributes: Record<string, string | number | boolean>;
  source: 'server' | 'client';
};

const clearTelemetry = async () => {
  await fetch(`${baseUrl}/api/logs/clear`, { method: 'POST' });
  await fetch(`${baseUrl}/api/spans/clear`, { method: 'POST' });
};

const getLogs = async (): Promise<LogEvent[]> => {
  const response = await fetch(`${baseUrl}/api/logs`);
  const body = (await response.json()) as { events: LogEvent[] };
  return body.events;
};

const getSpans = async (): Promise<SerializedSpan[]> => {
  const response = await fetch(`${baseUrl}/api/spans`);
  const body = (await response.json()) as { spans: SerializedSpan[] };
  return body.spans;
};

const waitForLogs = async (
  predicate: (events: LogEvent[]) => boolean,
  timeout = 5000,
) => {
  await waitFor(
    async () => {
      const events = await getLogs();
      if (!predicate(events)) {
        throw new Error('log events not ready');
      }
    },
    { timeout },
  );
  return getLogs();
};

const waitForSpans = async (
  predicate: (spans: SerializedSpan[]) => boolean,
  timeout = 5000,
) => {
  await waitFor(
    async () => {
      const spans = await getSpans();
      if (!predicate(spans)) {
        throw new Error('spans not ready');
      }
    },
    { timeout },
  );
  return getSpans();
};

describe('logging', () => {
  describe('start', () => {
    beforeAll(async () => {
      const start = await sku('start');
      await start.findByText('Starting development server');
      await waitFor(
        async () => {
          const response = await fetch(baseUrl);
          expect(response.ok || response.status === 500).toBe(true);
        },
        { timeout: 30000 },
      );
    });

    it('records onListen and document SSR loader success with parent/child spans', async ({
      task,
    }) => {
      skipCleanup(task.id);
      await clearTelemetry();

      const response = await fetch(baseUrl);
      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain('data-testid="home-page"');
      expect(html).toContain('data-testid="home-work"');

      const events = await waitForLogs((logs) =>
        logs.some(
          (event) => event.event === 'loader' && event.status === 'success',
        ),
      );
      expect(events.some((event) => event.event === 'http.request')).toBe(true);
      expect(events.some((event) => event.event === 'api.work')).toBe(true);

      const spans = await waitForSpans(
        (recorded) =>
          recorded.some((span) => span.name.startsWith('HTTP GET')) &&
          recorded.some((span) => span.name.startsWith('loader')) &&
          recorded.some((span) => span.name.includes('/api/work')),
      );

      const documentSpan = spans.find((span) => span.name === 'HTTP GET /');
      const loaderSpan = spans.find((span) => span.name.startsWith('loader'));
      const workSpan = spans.find((span) => span.name.includes('/api/work'));

      expect(documentSpan).toBeTruthy();
      expect(loaderSpan).toBeTruthy();
      expect(workSpan).toBeTruthy();
      expect(loaderSpan?.parentSpanId).toBe(documentSpan?.spanId);
      expect(workSpan?.parentSpanId).toBe(loaderSpan?.spanId);
      expect(workSpan?.traceId).toBe(documentSpan?.traceId);
    });

    it('records loader errors in logs, spans, and ErrorBoundary HTML', async ({
      task,
    }) => {
      skipCleanup(task.id);
      await clearTelemetry();

      const response = await fetch(`${baseUrl}/loader-error`);
      expect(response.status).toBe(500);
      const html = await response.text();
      expect(html).toContain('data-testid="error-boundary"');
      expect(html).toContain('Boom from loader');

      const events = await waitForLogs((logs) =>
        logs.some(
          (event) => event.event === 'loader' && event.level === 'error',
        ),
      );
      expect(
        events.some(
          (event) =>
            event.event === 'route.error' &&
            String(event.message).includes('Boom from loader'),
        ),
      ).toBe(true);

      const spans = await waitForSpans((recorded) =>
        recorded.some(
          (span) =>
            span.name.startsWith('loader') &&
            span.statusCode === SPAN_STATUS_ERROR,
        ),
      );
      const loaderSpan = spans.find((span) => span.name.startsWith('loader'));
      expect(loaderSpan?.statusCode).toBe(SPAN_STATUS_ERROR);
    });

    it('records render and suspense errors via ErrorBoundary', async ({
      task,
    }) => {
      skipCleanup(task.id);

      await clearTelemetry();
      const renderResponse = await fetch(`${baseUrl}/render-error`);
      expect(renderResponse.status).toBe(500);
      const renderHtml = await renderResponse.text();
      expect(renderHtml).toContain('data-testid="error-boundary"');
      expect(renderHtml).toContain('Boom from render');
      await waitForLogs((logs) =>
        logs.some(
          (event) =>
            event.event === 'route.error' &&
            String(event.message).includes('Boom from render'),
        ),
      );

      await clearTelemetry();
      const suspenseResponse = await fetch(`${baseUrl}/suspense-error`);
      expect(suspenseResponse.status).toBe(500);
      const suspenseHtml = await suspenseResponse.text();
      expect(suspenseHtml).toContain('data-testid="error-boundary"');
      expect(suspenseHtml).toContain('Boom from suspense');
      await waitForLogs((logs) =>
        logs.some(
          (event) =>
            event.event === 'route.error' &&
            String(event.message).includes('Boom from suspense'),
        ),
      );
    });

    it('links client navigation spans to server /api/work via traceparent', async ({
      task,
    }) => {
      skipCleanup(task.id);
      const page = await createPage();

      await page.goto(`${baseUrl}/action-error`, { waitUntil: 'load' });
      await page.getByTestId('action-error-page').waitFor({ state: 'visible' });
      await clearTelemetry();

      await page.getByTestId('nav-home').click();
      await page.getByTestId('home-page').waitFor({ state: 'visible' });
      expect(await page.getByTestId('home-work').textContent()).toBe('done');

      const spans = await waitForSpans((recorded) => {
        const clientNavigate = recorded.find(
          (span) =>
            span.source === 'client' && span.name.startsWith('navigate'),
        );
        const clientLoader = recorded.find(
          (span) => span.source === 'client' && span.name.startsWith('loader'),
        );
        const work = recorded.find(
          (span) => span.source === 'server' && span.name.includes('/api/work'),
        );
        return Boolean(
          clientNavigate &&
          clientLoader &&
          work &&
          clientNavigate.traceId === work.traceId &&
          clientLoader.traceId === work.traceId,
        );
      }, 15000);

      const clientNavigate = spans.find(
        (span) => span.source === 'client' && span.name.startsWith('navigate'),
      );
      const clientLoader = spans.find(
        (span) => span.source === 'client' && span.name.startsWith('loader'),
      );
      const work = spans.find(
        (span) => span.source === 'server' && span.name.includes('/api/work'),
      );

      expect(clientLoader?.parentSpanId).toBe(clientNavigate?.spanId);
      expect(work?.parentSpanId).toBe(clientLoader?.spanId);
      expect(work?.traceId).toBe(clientNavigate?.traceId);

      await page.close();
    });

    it('surfaces client loader and action errors in the ErrorBoundary', async ({
      task,
    }) => {
      skipCleanup(task.id);
      const page = await createPage();

      await page.goto(baseUrl, { waitUntil: 'load' });
      await page.getByTestId('home-page').waitFor({ state: 'visible' });
      await clearTelemetry();

      await page.getByTestId('nav-loader-error').click();
      await page.getByTestId('error-boundary').waitFor({ state: 'visible' });
      expect(await page.getByTestId('error-message').textContent()).toContain(
        'Boom from loader',
      );

      await waitForLogs((logs) =>
        logs.some(
          (event) =>
            event.event === 'loader' &&
            event.level === 'error' &&
            String(event.message).includes('Boom from loader'),
        ),
      );

      await page.getByTestId('nav-action-error').click();
      await page.getByTestId('action-error-page').waitFor({ state: 'visible' });
      await clearTelemetry();
      await page.getByTestId('action-error-submit').click();
      await page.getByTestId('error-boundary').waitFor({ state: 'visible' });
      expect(await page.getByTestId('error-message').textContent()).toContain(
        'Boom from action',
      );

      await waitForLogs((logs) =>
        logs.some(
          (event) =>
            event.event === 'action' &&
            event.level === 'error' &&
            String(event.message).includes('Boom from action'),
        ),
      );

      await page.close();
    });
  });
});

describe('logging production', () => {
  describe('build + start:prod', () => {
    const prodUrl = 'http://127.0.0.1:8213';

    beforeAll(async () => {
      const build = await sku('build');
      await build.findByText('Sku build complete');
    });

    it('records loader errors on the production server', async ({ task }) => {
      skipCleanup(task.id);
      await node(['dist/server/server.js'], {
        spawnOpts: {
          env: { ...process.env, PORT: '8213' },
        },
      });

      await waitFor(
        async () => {
          const response = await fetch(`${prodUrl}/loader-error`);
          expect(response.status).toBe(500);
        },
        { timeout: 15000 },
      );

      await fetch(`${prodUrl}/api/logs/clear`, { method: 'POST' });
      await fetch(`${prodUrl}/api/spans/clear`, { method: 'POST' });

      const response = await fetch(`${prodUrl}/loader-error`);
      expect(response.status).toBe(500);
      expect(await response.text()).toContain('Boom from loader');

      await waitFor(
        async () => {
          const logsResponse = await fetch(`${prodUrl}/api/logs`);
          const body = (await logsResponse.json()) as { events: LogEvent[] };
          if (
            !body.events.some(
              (event) =>
                (event.event === 'loader' || event.event === 'route.error') &&
                event.level === 'error',
            )
          ) {
            throw new Error('prod loader error log missing');
          }
        },
        { timeout: 5000 },
      );
    });
  });
});
