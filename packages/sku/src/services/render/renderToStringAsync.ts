import { text } from 'node:stream/consumers';

import { createDebug } from 'obug';
import { prerenderToNodeStream } from 'react-dom/static';
import type { ReactNode } from 'react';

const RENDER_TIMEOUT_MS = 5000;

const log = createDebug('sku:render:renderToStringAsync');

/**
 * Renders a React node to a string in a way that is compatible with Suspense and async rendering.
 * Will await all Suspense boundaries before resolving the promise.
 * @returns Promise that resolves with the rendered HTML string.
 */
export async function renderToStringAsync(
  reactNode: ReactNode,
): Promise<string> {
  log('Starting render');

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    log(`Timeout after not completing render in ${RENDER_TIMEOUT_MS}ms`);
    controller.abort(
      new Error(
        'Timeout during Render. Render did not complete in time. You may have a hanging promise or perpetually suspended component.',
      ),
    );
  }, RENDER_TIMEOUT_MS);

  try {
    const { prelude } = await prerenderToNodeStream(reactNode, {
      signal: controller.signal,
      onError(error) {
        log('Render Error:', error);
      },
    });

    const timedOut = controller.signal.aborted;
    const html = await text(prelude);

    if (timedOut && html === '') {
      throw controller.signal.reason;
    }

    log('Render complete');

    return html;
  } catch (error) {
    // A Shell Error is unrecoverable. Reject so that Error handling can resolve the response.
    log('Shell Render Error:', error);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
