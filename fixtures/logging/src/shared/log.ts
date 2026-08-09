import { context, trace } from '@opentelemetry/api';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogEvent = {
  level: LogLevel;
  event: string;
  time: string;
  traceId?: string;
  [key: string]: unknown;
};

type TelemetryGlobal = typeof globalThis & {
  __skuLoggingFixture?: {
    logEvents: LogEvent[];
  };
};

const MAX_EVENTS = 500;
const isServer = typeof window === 'undefined';

const store = (): LogEvent[] => {
  if (!isServer) {
    return [];
  }
  const g = globalThis as TelemetryGlobal;
  if (!g.__skuLoggingFixture) {
    g.__skuLoggingFixture = { logEvents: [] };
  }
  return g.__skuLoggingFixture.logEvents;
};

export const getLogEvents = (): LogEvent[] => [...store()];

export const clearLogEvents = (): void => {
  store().length = 0;
};

export const ingestLogEvents = (events: LogEvent[]): void => {
  const eventsStore = store();
  for (const event of events) {
    eventsStore.push(event);
    if (eventsStore.length > MAX_EVENTS) {
      eventsStore.shift();
    }
  }
};

const activeTraceId = (): string | undefined => {
  const span = trace.getSpan(context.active());
  const spanContext = span?.spanContext();
  if (
    !spanContext ||
    spanContext.traceId === '00000000000000000000000000000000'
  ) {
    return undefined;
  }
  return spanContext.traceId;
};

const emit = (
  level: LogLevel,
  event: string,
  fields: Record<string, unknown> = {},
) => {
  const entry: LogEvent = {
    level,
    event,
    time: new Date().toISOString(),
    traceId: activeTraceId(),
    ...fields,
  };

  // eslint-disable-next-line no-console
  console[level === 'debug' ? 'log' : level](JSON.stringify(entry));

  if (isServer) {
    ingestLogEvents([entry]);
    return;
  }

  // eslint-disable-next-line no-void
  void fetch('/api/logs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ events: [entry] }),
  }).catch(() => {
    // Telemetry ingest must not break the app.
  });
};

export const log = {
  debug: (event: string, fields?: Record<string, unknown>) =>
    emit('debug', event, fields),
  info: (event: string, fields?: Record<string, unknown>) =>
    emit('info', event, fields),
  warn: (event: string, fields?: Record<string, unknown>) =>
    emit('warn', event, fields),
  error: (event: string, fields?: Record<string, unknown>) =>
    emit('error', event, fields),
};
