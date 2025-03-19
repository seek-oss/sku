import type { Collector } from '@/services/vite/loadable/collector.js';
import { LoadableProvider } from '@/services/vite/loadable/PreloadContext.jsx';
import { renderToStringAsync } from '@/services/webpack/entry/render/render-to-string.js';
import debug from 'debug';
import type { ReactNode } from 'react';

import type { Render, RenderAppProps } from '@/types/types.js';
import { serializeConfig } from '../serializeConfig.js';

type CreatePreRenderedHtmlOptions<App> = {
  render: Render<App>;
  hooks?: {
    getBodyTags?: () => string[];
    getHeadTags?: () => string[];
  };
  loadableCollector: Collector;
} & Omit<
  RenderAppProps,
  | 'options'
  | '_addChunk'
  | 'SkuProvider'
  | 'renderToStringAsync'
  | 'webpackStats'
>;

export const createPreRenderedHtml = async <App,>({
  environment,
  language,
  route,
  routeName,
  site,
  render,
  hooks,
  loadableCollector,
}: CreatePreRenderedHtmlOptions<App>) => {
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
      ...renderContext,
      app,
      site,
    })) || {};

  function getHeadTags() {
    return [
      ...loadableCollector.getAllLinks(),
      ...loadableCollector.getAllPreloads(),
    ];
  }

  const bodyTags: string[] = [];
  if (hooks?.getBodyTags) {
    bodyTags.push(...hooks.getBodyTags());
  }
  if (Object.keys(clientContext).length > 0) {
    serializeConfig(clientContext);
  }
  bodyTags.push(...loadableCollector.getAllScripts());

  const result = await render.renderDocument({
    ...renderContext,
    headTags: getHeadTags().join('\n'),
    bodyTags: bodyTags.join('\n'),
    app,
  });

  return result;
};
