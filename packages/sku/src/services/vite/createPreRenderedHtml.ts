import { Transform } from 'node:stream';
import { createCollector } from './preload/collector.js';
import { getClosingHtml, getOpeningHtml } from './createIndex.js';
import { serializeConfig } from './helpers/serializeConfig.js';

type CreatePreRenderedHtmlOptions = {
  url: string;
  render: any;
  manifest: any;
  site: any;
  extraHeadTags?: string;
  extraBodyTags?: string;
};

export const createPreRenderedHtml = async ({
  url,
  render,
  manifest,
  site,
  extraBodyTags = '',
  extraHeadTags = '',
}: CreatePreRenderedHtmlOptions): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    let didError = false;

    const loadableCollector = createCollector({
      manifest,
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
        onShellError(error: any) {
          didError = true;
          reject(error);
        },
        onShellReady() {
          const bodyTags = [
            Object.keys(clientContext).length > 0 &&
              serializeConfig(clientContext),
            renderedBodyTags,
            extraBodyTags,
            loadableCollector.getAllScripts(),
          ]
            .filter(Boolean)
            .join('\n');

          const headTags = [
            renderedHeadTags,
            extraHeadTags,
            loadableCollector.getAllPreloads(),
          ].join('\n');

          const startHtml = getOpeningHtml({
            title: 'Sku Project',
            headTags,
          });

          html += startHtml;

          const transformStream = new Transform({
            transform(chunk, encoding, callback) {
              html += chunk.toString();
              callback();
            },
          });

          transformStream.on('finish', () => {
            html += getClosingHtml({ bodyTags });
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
