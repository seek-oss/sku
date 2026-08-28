import {
  type Span,
  context,
  propagation,
  SpanStatusCode,
  trace,
  type Context,
} from '@opentelemetry/api';
import {
  ExportResultCode,
  type ExportResult,
  W3CTraceContextPropagator,
} from '@opentelemetry/core';
import type { ReadableSpan, SpanExporter } from '@opentelemetry/sdk-trace-base';

export type SerializedSpan = {
  name: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  statusCode: number;
  attributes: Record<string, string | number | boolean>;
  events: Array<{ name: string }>;
  source: 'server' | 'client';
};

export const TRACER_NAME = 'sku-fixtures-logging';

type TelemetryGlobal = typeof globalThis & {
  __skuLoggingFixtureSpans?: {
    spans: SerializedSpan[];
  };
};

const MAX_SPANS = 500;

const store = (): SerializedSpan[] => {
  if (typeof window !== 'undefined') {
    return [];
  }
  const g = globalThis as TelemetryGlobal;
  if (!g.__skuLoggingFixtureSpans) {
    g.__skuLoggingFixtureSpans = { spans: [] };
  }
  return g.__skuLoggingFixtureSpans.spans;
};

export const getRecordedSpans = (): SerializedSpan[] => [...store()];

export const clearRecordedSpans = (): void => {
  store().length = 0;
};

export const ingestSpans = (spans: SerializedSpan[]): void => {
  const spansStore = store();
  for (const span of spans) {
    spansStore.push(span);
    if (spansStore.length > MAX_SPANS) {
      spansStore.shift();
    }
  }
};

export const serializeReadableSpan = (
  span: ReadableSpan,
  source: 'server' | 'client',
): SerializedSpan => {
  const attributes: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(span.attributes)) {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      attributes[key] = value;
    }
  }

  return {
    name: span.name,
    traceId: span.spanContext().traceId,
    spanId: span.spanContext().spanId,
    parentSpanId: span.parentSpanContext?.spanId,
    statusCode: span.status.code,
    attributes,
    events: span.events.map((event) => ({ name: event.name })),
    source,
  };
};

export class RecordingSpanExporter implements SpanExporter {
  constructor(private readonly source: 'server' | 'client') {}

  export(
    spans: ReadableSpan[],
    resultCallback: (result: ExportResult) => void,
  ): void {
    ingestSpans(spans.map((span) => serializeReadableSpan(span, this.source)));
    resultCallback({ code: ExportResultCode.SUCCESS });
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }
}

export const w3cPropagator = () => new W3CTraceContextPropagator();

export const getTracer = () => trace.getTracer(TRACER_NAME);

export const injectTraceHeaders = (
  carrier: Record<string, string>,
  activeContext: Context = context.active(),
): Record<string, string> => {
  propagation.inject(activeContext, carrier);
  return carrier;
};

/** Browser instrumentations set this so isomorphic loaders can inject after awaits. */
let clientPropagationContext: Context | undefined;

export const setClientPropagationContext = (ctx: Context | undefined): void => {
  clientPropagationContext = ctx;
};

export const injectCurrentTraceHeaders = (
  carrier: Record<string, string>,
): Record<string, string> =>
  injectTraceHeaders(carrier, clientPropagationContext ?? context.active());

export const extractContextFromHeaders = (
  headers: Record<string, string | string[] | undefined>,
): Context => {
  const carrier: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === 'string') {
      carrier[key.toLowerCase()] = value;
    } else if (Array.isArray(value) && value[0]) {
      carrier[key.toLowerCase()] = value[0];
    }
  }
  return propagation.extract(context.active(), carrier);
};

export const markSpanError = (span: Span, error: unknown): void => {
  if (error instanceof Error) {
    span.recordException(error);
  } else {
    span.recordException(new Error(String(error)));
  }
  span.setStatus({ code: SpanStatusCode.ERROR });
};

export const runWithSpan = async <T>(
  name: string,
  attributes: Record<string, string>,
  fn: (span: Span) => Promise<T>,
  parentContext: Context = context.active(),
): Promise<T> =>
  context.with(parentContext, () =>
    getTracer().startActiveSpan(name, { attributes }, async (span) => {
      try {
        return await fn(span);
      } catch (error) {
        markSpanError(span, error);
        throw error;
      } finally {
        span.end();
      }
    }),
  );
