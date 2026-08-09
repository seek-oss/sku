import { context, trace } from '@opentelemetry/api';
import type { ClientInstrumentation } from 'react-router';

import { log } from '../shared/log.js';

import {
  beginNavigationSpan,
  endNavigationSpan,
  getTracer,
  markSpanError,
  navigationParentContext,
  setClientPropagationContext,
} from './tracing.js';

export const clientInstrumentation: ClientInstrumentation = {
  router(router) {
    router.instrument({
      async navigate(callNavigate, info) {
        const span = getTracer().startSpan(`navigate ${String(info.to)}`, {
          attributes: {
            'rr.navigation.to': String(info.to),
            'rr.navigation.from': info.currentUrl,
          },
        });
        const spanContext = beginNavigationSpan(span);

        try {
          return await context.with(spanContext, async () => {
            const { status, error } = await callNavigate();
            if (status === 'error') {
              markSpanError(span, error);
              log.error('navigate', {
                to: info.to,
                message: error?.message,
              });
            } else {
              log.info('navigate', {
                to: info.to,
                status: 'success',
              });
            }
          });
        } finally {
          endNavigationSpan();
          span.end();
        }
      },
      async fetch(callFetch, info) {
        const span = getTracer().startSpan(`fetch ${info.href}`, {
          attributes: {
            'rr.fetch.href': info.href,
            'rr.fetch.key': info.fetcherKey,
          },
        });

        try {
          return await context.with(
            trace.setSpan(context.active(), span),
            async () => {
              const { status, error } = await callFetch();
              if (status === 'error') {
                markSpanError(span, error);
                log.error('fetch', {
                  href: info.href,
                  message: error?.message,
                });
              } else {
                log.info('fetch', { href: info.href, status: 'success' });
              }
            },
          );
        } finally {
          span.end();
        }
      },
    });
  },
  route(route) {
    route.instrument({
      async loader(callLoader, info) {
        const pattern = info.pattern ?? route.path ?? route.id ?? 'unknown';
        const parentContext = navigationParentContext();
        const span = getTracer().startSpan(
          `loader ${pattern}`,
          {
            attributes: {
              'rr.route.id': route.id ?? '',
              'rr.route.pattern': pattern,
              'rr.handler': 'loader',
            },
          },
          parentContext,
        );
        const spanContext = trace.setSpan(parentContext, span);
        setClientPropagationContext(spanContext);

        try {
          return await context.with(spanContext, async () => {
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
          });
        } finally {
          setClientPropagationContext(undefined);
          span.end();
        }
      },
      async action(callAction, info) {
        const pattern = info.pattern ?? route.path ?? route.id ?? 'unknown';
        const parentContext = navigationParentContext();
        const span = getTracer().startSpan(
          `action ${pattern}`,
          {
            attributes: {
              'rr.route.id': route.id ?? '',
              'rr.route.pattern': pattern,
              'rr.handler': 'action',
            },
          },
          parentContext,
        );
        const spanContext = trace.setSpan(parentContext, span);
        setClientPropagationContext(spanContext);

        try {
          return await context.with(spanContext, async () => {
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
          });
        } finally {
          setClientPropagationContext(undefined);
          span.end();
        }
      },
    });
  },
};
