import { resourceFromAttributes } from '@opentelemetry/resources';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

import { RecordingSpanExporter, w3cPropagator } from '../shared/tracing.js';

let started = false;

export const startServerTracing = (): void => {
  if (started) {
    return;
  }
  started = true;

  const provider = new NodeTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: 'sku-fixtures-logging-server',
    }),
    spanProcessors: [
      new SimpleSpanProcessor(new RecordingSpanExporter('server')),
    ],
  });

  provider.register({
    propagator: w3cPropagator(),
  });
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
