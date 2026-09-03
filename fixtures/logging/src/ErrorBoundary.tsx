import { isRouteErrorResponse, useRouteError } from 'react-router';
import { context, trace } from '@opentelemetry/api';

import { log } from './shared/log.js';

export function ErrorBoundary() {
  const error = useRouteError();
  const activeSpan = trace.getSpan(context.active());
  const traceId = activeSpan?.spanContext().traceId;

  if (isRouteErrorResponse(error)) {
    log.error('route.error', {
      status: error.status,
      statusText: error.statusText,
      data: typeof error.data === 'string' ? error.data : undefined,
      message:
        typeof error.data === 'string'
          ? error.data
          : `${error.status} ${error.statusText}`,
      traceId,
    });
    activeSpan?.addEvent('route.error', {
      status: error.status,
    });

    return (
      <main data-testid="error-boundary">
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p data-testid="error-message">
          {typeof error.data === 'string' ? error.data : 'Request failed'}
        </p>
      </main>
    );
  }

  const message = error instanceof Error ? error.message : 'Unknown error';
  log.error('route.error', { message, traceId });
  if (error instanceof Error) {
    activeSpan?.recordException(error);
  }
  activeSpan?.addEvent('route.error', { message });

  return (
    <main data-testid="error-boundary">
      <h1>Something went wrong</h1>
      <p data-testid="error-message">{message}</p>
    </main>
  );
}
