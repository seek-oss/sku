import { Writable } from 'node:stream';

import debug from 'debug';
import { renderToPipeableStream } from 'react-dom/server';

/**
 * Renders a React node to a string in a way that is compatible with Suspense and async rendering.
 * Will await all Suspense boundaries before resolving the promise.
 * @returns Promise that resolves with the rendered HTML string.
 */
export function renderToString(
  reactNode,
  { timeout = 5000, waitForAllReady = true } = {},
) {
  console.warn(
    "Use of render function is experimental. It's API and behaviour may change, and you may experience unexpected behaviours.",
  );
  debug('sku:render:renderToString')('Starting render');

  return new Promise((resolve, reject) => {
    let hasErrored = false;
    let hasRendered = false;
    const { pipe, abort } = renderToPipeableStream(reactNode, {
      onShellError(error) {
        debug('sku:render:renderToString')('Shell Error', {
          error,
        });
      },
      onShellReady() {
        debug('sku:render:renderToString')('Shell Ready: No action');
        if (!waitForAllReady) {
          startRender();
        }
      },
      async onAllReady() {
        debug('sku:render:renderToString')(
          'All Ready: Writing Stream to String',
        );
        if (waitForAllReady) {
          startRender();
        }
      },
      onError(error) {
        debug('sku:render:renderToString')('Render Error:', {
          error,
        });
        hasErrored = true;
        reject(error);
      },
    });
    setTimeout(() => {
      if (hasErrored || hasRendered) {
        return;
      }
      abort(
        new Error(
          'Timeout during Render. Render did not complete in time (5 seconds). You may may have a hanging promise or perpetually Suspense component.',
        ),
      );
    }, timeout);
    function startRender() {
      if (hasErrored) {
        return;
      }
      debug('sku:render:renderToString')('Starting Stream to String');
      hasRendered = true;
      let html = '';
      const stream = new Writable({
        write(chunk, _encoding, callback) {
          html += chunk.toString();
          callback();
        },
        final(callback) {
          debug('sku:render:renderToString')('Stream Ended. Returning HTML', {
            event: 'Writable:final',
          });
          resolve(html);
          callback();
        },
      });
      pipe(stream);
    }
  });
}
