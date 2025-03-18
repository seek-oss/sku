import { Transform } from 'node:stream';
import { getClosingHtml, getOpeningHtml } from './createIndex.js';
import { serializeConfig } from '../serializeConfig.js';
import type { Render, RenderAppProps, ViteRenderAppProps } from '@/types/types.js';
import { createCollector } from '@/services/vite/loadable/collector.js';
import { LoadableProvider } from '../../loadable/PreloadContext.jsx';
import { renderToStringAsync } from '@/services/webpack/entry/render/render-to-string.js';
import debug from 'debug';
import { ReactNode } from 'react';
import { NormalizedRoute } from '@/context/createSkuContext.js';

// Has to be strongly typed once the first entity in renderContext is known.

type CreatePreRenderedHtmlOptions<App> = {
  route: NormalizedRoute;
  render: Render<App>;
  hooks?: {
    getBodyTags?: () => string;
    getHeadTags?: () => string;
  };
} & Omit<RenderAppProps, 'options'>;

export async function  createPreRenderedHtml<App>({
  render,
  site,
  route,
}: CreatePreRenderedHtmlOptions<App>): Promise<string> {
  
  const loadableCollector = createCollector({});
  let clientContext = {};
  // TODO: Transform NormalisedRoute to RenderProps as per packages/sku/src/services/webpack/config/plugins/createHtmlRenderPlugin.ts:76
    const renderContext = {...route};

  const SkuProvider: ({ children }: { children: ReactNode }) => JSX.Element = ({ children }) => (
    <LoadableProvider value={loadableCollector}>
      {children}
    </LoadableProvider>
  );

    if (!render.renderApp) {
      throw new Error('Not Implemented: Libraries are not supported yet.');
    }

    const app = await render.renderApp({
      ...renderContext,
      _addChunk: (chunkName) => {
        loadableCollector.register(chunkName);
      },
      SkuProvider,
      renderToStringAsync,
      environment: 'server',
      language: renderContext.language,
      route: renderContext.route,
      routeName: 'jeff',
      site
    });
    if (renderContext.language) {
      debug('sku:render:language')(
        `Using language "${renderContext.language}" for route "${renderContext.route}"`,
      );
      // @ts-expect-error - addChunk is not on the ChunkExtractor type
      extractor.addChunk(getChunkName(renderContext.language));
    } else {
      debug('sku:render:language')(
        `No language on route "${renderContext.route}"`,
      );
    }

    return '';

    // if (render.provideClientContext) {
    //   // Check what kind of context needs to be passed into this function.
    //   clientContext = await render.provideClientContext({
    //     app,
    //     site,
    //     url,
    //   });
    // }

    // This can be improved? Thinking of the interface can improve.
    // We need to use the client generated header for the SSG/SSR rendering so using a html document is not the best way to do it.
    // That was what .renderDocument was doing.
    // const renderedBodyTags = render.bodyTags ? await render.bodyTags() : '';
    // const renderedHeadTags = render.headTags ? await render.headTags() : '';

    // let html = '';

    //   const { pipe } = await render.render({
    //     url,
    //     site,
    //     renderContext,
    //     options: {
    //       onShellError(error: any) {
    //         reject(error);
    //       },
    //       onError(error: any) {
    //         console.error(error);
    //       },
    //       onAllReady() {
    //         const extraBodyTags = getBodyTags ? getBodyTags() : '';
    //         const bodyTags = [
    //           Object.keys(clientContext).length > 0 &&
    //             serializeConfig(clientContext),
    //           renderedBodyTags,
    //           extraBodyTags,
    //         ]
    //           .filter(Boolean)
    //           .join('\n');

    //         const extraHeadTags = getHeadTags ? getHeadTags() : '';
    //         const headTags = [renderedHeadTags, extraHeadTags].join('\n');

    //         const startHtml = getOpeningHtml({
    //           title: 'Sku Project',
    //           headTags,
    //         });

    //         html += startHtml;

    //         const transformStream = new Transform({
    //           transform(chunk, encoding, callback) {
    //             html += chunk.toString();
    //             callback();
    //           },
    //         });

    //         transformStream.on('finish', () => {
    //           html += getClosingHtml({ bodyTags });
    //           resolve(html);
    //         });

    //         pipe(transformStream);
    //       },
    //     },
    // });
  });
}
