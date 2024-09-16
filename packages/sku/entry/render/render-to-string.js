import { Writable } from 'node:stream';

import debug from 'debug';
import { renderToPipeableStream } from 'react-dom/server';

let hasWarned = false;

/**
 * Renders a React node to a string in a way that is compatible with Suspense and async rendering.
 * Will await all Suspense boundaries before resolving the promise.
 * @returns Promise that resolves with the rendered HTML string.
 */
export function renderToString(reactNode, { timeout = 5000 } = {}) {
  if (!hasWarned) {
    console.log(
      "Warning: The use of `renderApp`'s `renderToString` parameter is experimental. Its API and behaviour may change, and you may experience unexpected behaviours.",
    );
    hasWarned = true;
  }
  debug('sku:render:renderToString')('Starting render');

  return new Promise((resolve, reject) => {
    let hasErrored = false;
    let hasRendered = false;

    const { pipe, abort } = renderToPipeableStream(reactNode, {
      onShellError(error) {
        // A Shell Error is unrecoverable. Reject so that Error handling can resolve the response.
        debug('sku:render:renderToString')('Shell Render Error:', error);
        hasErrored = true;
        reject(error);
      },

      onError(error) {
        // Non-shell errors are recoverable. HTML shell can still be returned.
        debug('sku:render:renderToString')('Render Error:', error);
      },

      onShellReady() {
        debug('sku:render:renderToString')('Shell Ready: No action');
      },

      async onAllReady() {
        debug('sku:render:renderToString')(
          'All Ready: Ready to stream to string',
        );
        startStreamToString();
      },
    });

    setTimeout(() => {
      if (hasErrored || hasRendered) {
        return;
      }

      debug('sku:render:renderToString')(
        `Timeout after having not errored or rendered in ${timeout}ms`,
      );

      abort(
        'Timeout during Render. Render did not complete in time. You may may have a hanging promise or perpetually suspended component.',
      );
    }, timeout);

    function startStreamToString() {
      if (hasErrored) {
        return;
      }
      debug('sku:render:renderToString')('Starting streaming to string');
      hasRendered = true;
      let html = '';
      const stream = new Writable({
        write(chunk, _encoding, callback) {
          html += chunk.toString();
          callback();
        },
        destroy(callback) {
          debug('sku:render:renderToString')('Stream ended. Returning HTML');
          resolve(html);
          callback();
        },
      });
      pipe(stream);
    }
  });
}
