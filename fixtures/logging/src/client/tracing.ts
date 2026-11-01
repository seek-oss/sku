import {
  context,
  propagation,
  trace,
  type Context, type Span,
} from '@opentelemetry/api';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  SimpleSpanProcessor,
  StackContextManager,
  TracerProvider,
} from '@opentelemetry/sdk-trace';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

import {
  injectTraceHeaders,
  RecordingSpanExporter,
  serializeReadableSpan,
  setClientPropagationContext,
  w3cPropagator,
  type SerializedSpan,
} from '../shared/tracing.js';

let started = false;
let activeNavigationSpan: Span | undefined;

/** Client exporter also POSTs finished spans so e2e can read one sink. */
class ClientSpanExporter extends RecordingSpanExporter {
  constructor() {
    super('client');
  }

  override export(
    spans: Parameters<RecordingSpanExporter['export']>[0],
    resultCallback: Parameters<RecordingSpanExporter['export']>[1],
  ): void {
    super.export(spans, resultCallback);

    const payload: SerializedSpan[] = spans.map((span) =>
      serializeReadableSpan(span, 'client'),
    );

    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };
    injectTraceHeaders(headers);

    void fetch('/api/spans', {
      method: 'POST',
      headers,
      body: JSON.stringify({ spans: payload }),
    }).catch(() => {
      // Telemetry ingest must not break the app.
    });
  }
}

export const startClientTracing = (): void => {
  if (started || typeof window === 'undefined') {
    return;
  }
  started = true;

  const provider = new TracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: 'sku-fixtures-logging-client',
    }),
    spanProcessors: [
      new SimpleSpanProcessor({ exporter: new ClientSpanExporter() }),
    ],
  });

  trace.setGlobalTracerProvider(provider);
  context.setGlobalContextManager(new StackContextManager().enable());
  propagation.setGlobalPropagator(w3cPropagator());
};

export const beginNavigationSpan = (span: Span): Context => {
  activeNavigationSpan = span;
  return trace.setSpan(context.active(), span);
};

export const endNavigationSpan = (): void => {
  activeNavigationSpan = undefined;
};

export const navigationParentContext = (): Context =>
  activeNavigationSpan
    ? trace.setSpan(context.active(), activeNavigationSpan)
    : context.active();

export {
  injectTraceHeaders,
  injectCurrentTraceHeaders,
  setClientPropagationContext,
  runWithSpan,
  markSpanError,
  getTracer,
} from '../shared/tracing.js';
