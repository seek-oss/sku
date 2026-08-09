import { context, trace, type Context, type Span } from '@opentelemetry/api';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import {
  StackContextManager,
  WebTracerProvider,
} from '@opentelemetry/sdk-trace-web';
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

  const contextManager = new StackContextManager();
  contextManager.enable();
  context.setGlobalContextManager(contextManager);

  const provider = new WebTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: 'sku-fixtures-logging-client',
    }),
    spanProcessors: [new SimpleSpanProcessor(new ClientSpanExporter())],
  });

  provider.register({
    propagator: w3cPropagator(),
    contextManager,
  });
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
