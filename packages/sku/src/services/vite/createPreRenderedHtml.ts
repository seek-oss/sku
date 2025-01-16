import crypto from 'node:crypto';
import { Transform } from 'node:stream';
import createCSPHandler from '@/entry/csp.js';
import clientContextKey from '@/entry/clientContextKey.js';
import serializeJavascript from 'serialize-javascript';
import { createCollector } from '@/services/vite/preload/collector.js';
import { getClosingHtml, getOpeningHtml } from '@/services/vite/createIndex.js';

type CreatePreRenderedHtmlOptions = {
  url: string;
  render: any;
  manifest: any;
  site: any;
};

export const serializeConfig = (config: object) =>
  `<script id="${clientContextKey}" type="application/json">${serializeJavascript(
    config,
    { isJSON: true },
  )}</script>`;

export const createPreRenderedHtml = async ({
  url,
  render,
  manifest,
  site,
}: CreatePreRenderedHtmlOptions): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    const nonce = crypto.randomBytes(16).toString('base64');

    let didError = false;

    const loadableCollector = createCollector({
      externalJsFiles: ['@vite/client'],
      manifest,
      nonce,
    });

    let clientContext = {};

    if (render.provideClientContext) {
      // Check what kind of context needs to be passed into this function.
      clientContext = await render.provideClientContext({
        site,
        url,
      });
    }

    // This can be improved? Thinking of the interface can improve.
    // We need to use the client generated header for the SSG/SSR rendering so using a html document is not the best way to do it.
    // That was what .renderDocument was doing.
    const renderedBodyTags = render.bodyTags ? await render.bodyTags() : '';
    const renderedHeadTags = render.headTags ? await render.headTags() : '';

    let html = '';

    const { pipe } = await render.render({
      url,
      site,
      loadableCollector,
      options: {
        nonce,
        onShellError(error: any) {
          didError = true;
          reject(error);
        },
        onShellReady() {
          const bodyTags = [
            Object.keys(clientContext).length > 0 &&
              serializeConfig(clientContext),
            renderedBodyTags,
            loadableCollector.getAllScripts(),
          ].join('\n');
          const headTags = [
            renderedHeadTags,
            loadableCollector.getAllPreloads(),
          ].join('\n');

          html += getOpeningHtml({
            nonce,
            title: 'Sku Project',
            headTags,
          });

          const transformStream = new Transform({
            transform(chunk, encoding, callback) {
              html += chunk.toString();
              callback();
            },
          });

          transformStream.on('finish', () => {
            html += getClosingHtml({
              bodyTags,
            });
            resolve(html);
          });

          pipe(transformStream);
        },
        onError(error: any) {
          didError = true;
          console.error(error);
        },
        onAllReady() {
          console.log('onAllReady');
        },
      },
    });
  });
};
