import { Writable } from 'node:stream';

import debug from 'debug';
import { renderToPipeableStream } from 'react-dom/server';
import type { ReactNode } from 'react';

const RENDER_TIMEOUT_MS = 5000;

let hasWarned = false;

/**
 * Renders a React node to a string in a way that is compatible with Suspense and async rendering.
 * Will await all Suspense boundaries before resolving the promise.
 * @returns Promise that resolves with the rendered HTML string.
 */
export function renderToStringAsync(reactNode: ReactNode) {
  if (!hasWarned) {
    console.log(
      "Warning: The use of `renderApp`'s `renderToStringAsync` parameter is experimental. Its API and behaviour may change, and you may experience unexpected behaviours.",
    );
    hasWarned = true;
  }
  debug('sku:render:renderToStringAsync')('Starting render');

  return new Promise((resolve, reject) => {
    let hasErrored = false;
    let hasRendered = false;

    const { pipe, abort } = renderToPipeableStream(reactNode, {
      onShellError(error) {
        // A Shell Error is unrecoverable. Reject so that Error handling can resolve the response.
        debug('sku:render:renderToStringAsync')('Shell Render Error:', error);
        hasErrored = true;
        reject(error);
      },

      onError(error) {
        // Non-shell errors are recoverable. HTML shell can still be returned.
        debug('sku:render:renderToStringAsync')('Render Error:', error);
      },

      onShellReady() {
        debug('sku:render:renderToStringAsync')('Shell Ready: No action');
      },

      async onAllReady() {
        debug('sku:render:renderToStringAsync')(
          'All Ready: Ready to stream to string',
        );
        startStreamToString();
      },
    });

    setTimeout(() => {
      if (hasErrored || hasRendered) {
        return;
      }

      debug('sku:render:renderToStringAsync')(
        `Timeout after having not errored or rendered in ${RENDER_TIMEOUT_MS}ms`,
      );

      abort(
        'Timeout during Render. Render did not complete in time. You may may have a hanging promise or perpetually suspended component.',
      );
    }, RENDER_TIMEOUT_MS);

    function startStreamToString() {
      if (hasErrored) {
        return;
      }
      debug('sku:render:renderToStringAsync')('Starting streaming to string');
      hasRendered = true;
      let html = '';
      const stream = new Writable({
        write(chunk, _encoding, callback) {
          html += chunk.toString();
          callback();
        },
        // Potential error here before. We were calling callback() on the error parameter.
        destroy(_error, callback) {
          debug('sku:render:renderToStringAsync')(
            'Stream ended. Returning HTML',
          );
          resolve(html);
          callback();
        },
      });
      pipe(stream);
    }
  });
}
