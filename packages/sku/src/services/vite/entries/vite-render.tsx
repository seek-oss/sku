import { createCollector } from '@/services/vite/loadable/collector.js';
import { LoadableProvider } from '@/services/vite/loadable/PreloadContext.jsx';
import { renderToStringAsync } from '@/services/webpack/entry/render/render-to-string.js';
import debug from 'debug';
import type { ReactNode } from 'react';

import render from '__sku_alias__renderEntry';
import type { ViteRenderFunction } from '@/types/types.js';

export const viteRender: ViteRenderFunction = async ({
  environment,
  language,
  route,
  routeName,
  site,
}) => {
  const loadableCollector = createCollector({});

  const renderContext = {
    environment,
    language,
    renderToStringAsync,
    route,
    routeName,
    site,
  };

  const SkuProvider: ({ children }: { children: ReactNode }) => JSX.Element = ({
    children,
  }) => (
    <LoadableProvider value={loadableCollector}>{children}</LoadableProvider>
  );

  if (!render.renderApp) {
    // TODO: Support library mode
    throw new Error('Not Implemented: Libraries are not supported yet.');
  }

  if (!routeName) {
    // TODO: I think this is a types issue. Routes should always exist and always have a name.
    throw new Error('Not Implemented: Unable to handle unnamed routes.');
  }

  const app = await render.renderApp({
    ...renderContext,
    _addChunk: (chunkName: string) => {
      loadableCollector.register(chunkName);
    },
    SkuProvider,
  });

  if (language) {
    debug('sku:render:language')(
      `Using language "${language}" for route "${route}"`,
    );
    // TODO: Add chunk for language
    console.error('Not Implemented: Add chunk for language');
    // extractor.addChunk(getChunkName(language));
  } else {
    debug('sku:render:language')(`No language on route "${route}"`);
  }

  const clientContext =
    (await render.provideClientContext?.({
      app,
      site,
      url,
    })) || {};

  // const result = await render.renderDocument({
  //   ...renderContext,
  //   headTags: loadableCollector.getHeadTags(),
  //   bodyTags,
  //   app,
  // });

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
};
