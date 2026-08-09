import { context, trace } from '@opentelemetry/api';
import type { ServerInstrumentation } from 'react-router';

import { log } from '../shared/log.js';
import { markSpanError } from './tracing.js';
import { getTracer } from '../shared/tracing.js';

export const routeInstrumentation: Pick<ServerInstrumentation, 'route'> = {
  route(route) {
    route.instrument({
      async loader(callLoader, info) {
        const pattern = info.pattern ?? route.path ?? route.id ?? 'unknown';
        const span = getTracer().startSpan(`loader ${pattern}`, {
          attributes: {
            'rr.route.id': route.id ?? '',
            'rr.route.pattern': pattern,
            'rr.handler': 'loader',
          },
        });

        try {
          return await context.with(
            trace.setSpan(context.active(), span),
            async () => {
              const { status, error } = await callLoader();
              if (status === 'error') {
                markSpanError(span, error);
                log.error('loader', {
                  routeId: route.id,
                  pattern,
                  message: error?.message,
                });
              } else {
                log.info('loader', {
                  routeId: route.id,
                  pattern,
                  status: 'success',
                });
              }
            },
          );
        } finally {
          span.end();
        }
      },
      async action(callAction, info) {
        const pattern = info.pattern ?? route.path ?? route.id ?? 'unknown';
        const span = getTracer().startSpan(`action ${pattern}`, {
          attributes: {
            'rr.route.id': route.id ?? '',
            'rr.route.pattern': pattern,
            'rr.handler': 'action',
          },
        });

        try {
          return await context.with(
            trace.setSpan(context.active(), span),
            async () => {
              const { status, error } = await callAction();
              if (status === 'error') {
                markSpanError(span, error);
                log.error('action', {
                  routeId: route.id,
                  pattern,
                  message: error?.message,
                });
              } else {
                log.info('action', {
                  routeId: route.id,
                  pattern,
                  status: 'success',
                });
              }
            },
          );
        } finally {
          span.end();
        }
      },
    });
  },
};
