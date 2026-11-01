import { context, propagation, trace } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SimpleSpanProcessor, TracerProvider } from '@opentelemetry/sdk-trace';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

import { RecordingSpanExporter, w3cPropagator } from '../shared/tracing.js';

let started = false;

export const startServerTracing = (): void => {
  if (started) {
    return;
  }
  started = true;

  const provider = new TracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: 'sku-fixtures-logging-server',
    }),
    spanProcessors: [
      new SimpleSpanProcessor({
        exporter: new RecordingSpanExporter('server'),
      }),
    ],
  });

  trace.setGlobalTracerProvider(provider);
  context.setGlobalContextManager(
    new AsyncLocalStorageContextManager().enable(),
  );
  propagation.setGlobalPropagator(w3cPropagator());
};

export {
  clearRecordedSpans,
  getRecordedSpans,
  ingestSpans,
  markSpanError,
  getTracer,
  type SerializedSpan,
} from '../shared/tracing.js';

const TELEMETRY_PATHS = new Set([
  '/api/logs',
  '/api/spans',
  '/api/logs/clear',
  '/api/spans/clear',
]);

export const shouldTraceHttpPath = (path: string): boolean => {
  if (TELEMETRY_PATHS.has(path)) {
    return false;
  }
  // Dev asset / HMR traffic — keep the demo focused on app requests.
  if (
    path.startsWith('/@') ||
    path.startsWith('/node_modules') ||
    path.startsWith('/src/') ||
    path.startsWith('/static/') ||
    path.includes('.vite/')
  ) {
    return false;
  }
  return true;
};
