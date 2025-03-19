import type { Render, RenderAppProps } from '@/types/types.js';
import type { Collector } from '@/services/vite/loadable/collector.js';
import { LoadableProvider } from '../../loadable/PreloadContext.js';
import { renderToStringAsync } from '@/services/webpack/entry/render/render-to-string.js';
import type { ReactNode } from 'react';
import { serializeConfig } from '../serializeConfig.js';

// Has to be strongly typed once the first entity in renderContext is known.
type CreatePreRenderedHtmlOptions<App> = {
  render: Render<App>;
  hooks?: {
    getBodyTags?: () => string;
    getHeadTags?: () => string;
  };
  collector: Collector;
} & Omit<
  RenderAppProps,
  | 'options'
  | '_addChunk'
  | 'SkuProvider'
  | 'renderToStringAsync'
  | 'webpackStats'
>;

export async function createPreRenderedHtml<App>({
  render,
  hooks,
  collector,
  ...renderContext
}: CreatePreRenderedHtmlOptions<App>): Promise<string> {
  let clientContext = {};

  const SkuProvider: ({ children }: { children: ReactNode }) => JSX.Element = ({
    children,
  }) => <LoadableProvider value={collector}>{children}</LoadableProvider>;

  if (!render.renderApp) {
    throw new Error('Not Implemented: Libraries are not supported yet.');
  }

  console.log('🚀 ~ app:');
  const app = await render.renderApp({
    ...renderContext,
    _addChunk: (chunkName) => {
      collector.register(chunkName);
    },
    SkuProvider,
    renderToStringAsync,
  });

  // if (renderContext.language) {
  //   debug('sku:render:language')(
  //     `Using language "${renderContext.language}" for route "${renderContext.route}"`,
  //   );
  //   // @ts-expect-error - addChunk is not on the ChunkExtractor type
  //   extractor.addChunk(getChunkName(renderContext.language));
  // } else {
  //   debug('sku:render:language')(
  //     `No language on route "${renderContext.route}"`,
  //   );
  // }

  if (render.provideClientContext) {
    // Check what kind of context needs to be passed into this function.
    clientContext = await render.provideClientContext({
      ...renderContext,
      app,
    });
  }

  const bodyTags =
    Object.keys(clientContext).length > 0
      ? [serializeConfig(clientContext), hooks?.getBodyTags?.()]
          .filter(Boolean)
          .join('\n')
      : hooks?.getBodyTags?.();

  const result = await render.renderDocument({
    ...renderContext,
    headTags: hooks?.getHeadTags?.() ?? '',
    bodyTags: bodyTags ?? '',
    app,
  });

  return result;

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
}
