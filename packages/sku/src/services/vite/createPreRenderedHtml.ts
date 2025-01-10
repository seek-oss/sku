import crypto from 'node:crypto';
import { createChunkCollector } from 'vite-preload';
import { Transform } from 'node:stream';
import createCSPHandler from '@/entry/csp.js';
import clientContextKey from '@/entry/clientContextKey.js';
import serializeJavascript from 'serialize-javascript';

type CreatePreRenderedHtmlOptions = {
  url: string;
  render: any;
  template: string;
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
  template,
  manifest,
  site,
}: CreatePreRenderedHtmlOptions): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    const nonce = crypto.randomBytes(16).toString('base64');

    let didError = false;

    const collector = createChunkCollector({
      manifest,
      preloadAssets: true,
      preloadFonts: true,
      nonce,
    });

    const [head, rest] = template.split(`<!--app-html-->`);
    let html = '';
    let clientContext = {};

    if (render.provideClientContext) {
      // Check what kind of context needs to be passed into this function.
      clientContext = await render.provideClientContext({
        site,
      });
    }

    // This can be improved? Thinking of the interface can improve.
    // We need to use the client generated header for the SSG/SSR rendering so using a html document is not the best way to do it.
    // That was what .renderDocument was doing.
    const renderedBodyTags = render.bodyTags ? await render.bodyTags() : '';
    const renderedHeadTags = render.headTags ? await render.headTags() : '';

    const bodyTags =
      Object.keys(clientContext).length > 0
        ? [serializeConfig(clientContext), renderedBodyTags].join('\n')
        : renderedBodyTags;

    // const result = await render.renderDocument({
    //   ...renderContext,
    //   headTags: getHeadTags(),
    //   bodyTags,
    //   app,
    // });

    // if (csp.enabled) {
    //   const cspHandler = createCSPHandler({
    //     extraHosts: [publicPath, ...csp.extraHosts],
    //     isDevelopment: process.env.NODE_ENV === 'development',
    //   });
    //
    //   return cspHandler.hanzdleHtml(result);
    // }

    const { pipe } = await render.render({
      url,
      site,
      collector,
      options: {
        nonce,
        onShellError(error: any) {
          didError = true;
          reject(error);
        },
        onShellReady() {
          console.log('onShellReady');

          const links = collector.getLinkHeaders();

          console.log('Links', links);

          const modules = collector.getChunks();

          console.log('Modules used', modules);

          const tags = collector.getTags();

          html += head
            .replaceAll('%NONCE%', nonce)
            .replace('<!--app-head-->', `${renderedHeadTags}\n${tags}`);

          const transformStream = new Transform({
            transform(chunk, encoding, callback) {
              html += chunk.toString();
              console.log('Chunk', chunk.length);
              callback();
            },
          });

          transformStream.on('finish', () => {
            html = `${html}\n${bodyTags}\n${rest}`;
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
