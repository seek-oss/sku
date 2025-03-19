import { createCollector } from '@/services/vite/loadable/collector.js';
import { LoadableProvider } from '@/services/vite/loadable/PreloadContext.jsx';
import { renderToStringAsync } from '@/services/webpack/entry/render/render-to-string.js';
import debug from 'debug';
import type { ReactNode } from 'react';
import type { NormalizedRoute } from '@/context/createSkuContext.js';

import render from '__sku_alias__renderEntry';
import type { ViteRenderAppProps } from '@/types/types.js';

export const viteRender = async ({
  site,
  route,
  language,
}: {
  url: ViteRenderAppProps['url'];
  site: string;
  language: string;
  clientEntry: string;
  route: NormalizedRoute;
}) => {
  const loadableCollector = createCollector({});
  const clientContext = {};
  // const renderContext = { ...route };

  const SkuProvider: ({ children }: { children: ReactNode }) => JSX.Element = ({
    children,
  }) => (
    <LoadableProvider value={loadableCollector}>{children}</LoadableProvider>
  );

  if (!render.renderApp) {
    // TODO: Support library mode
    throw new Error('Not Implemented: Libraries are not supported yet.');
  }

  if (!route.name) {
    // TODO: I think this is a types issue. Routes should always exist and always have a name.
    throw new Error('Not Implemented: Unable to handle unnamed routes.');
  }

  const app = await render.renderApp({
    // ...renderContext,
    _addChunk: (chunkName: string) => {
      loadableCollector.register(chunkName);
    },
    SkuProvider,
    renderToStringAsync,
    environment: 'server',
    language,
    route: route.route,
    routeName: route.name,
    site,
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

  const result = await render.renderDocument({
    ...renderContext,
    headTags: loadableCollector.getHeadTags(),
    bodyTags,
    app,
  });

  return result;
};
