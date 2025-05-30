import { LoadableProvider } from '@sku-lib/vite/loadable';
import type { Collector } from '@sku-lib/vite/collector';
import { renderToStringAsync } from '@/services/webpack/entry/render/render-to-string.js';
import debug from 'debug';
import type { ReactNode } from 'react';

import type { Render, RenderAppProps } from '@/types/types.js';
import { serializeConfig } from '../serializeConfig.js';
import { getChunkName } from '@vocab/vite/chunks';

const log = debug('sku:render:html');

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

  log('Rendering app for route:', route, renderContext);

  const SkuProvider: ({ children }: { children: ReactNode }) => JSX.Element = ({
    children,
  }) => (
    <LoadableProvider value={loadableCollector}>{children}</LoadableProvider>
  );

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
    loadableCollector.register(getChunkName(renderContext.language));
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
    return [...loadableCollector.getAllPreloads()];
  }

  const bodyTags: string[] = [];
  if (hooks?.getBodyTags) {
    bodyTags.push(...hooks.getBodyTags());
  }
  if (Object.keys(clientContext).length > 0) {
    bodyTags.push(serializeConfig(clientContext));
  }

  bodyTags.push(...loadableCollector.getAllScripts());

  return await render.renderDocument({
    ...renderContext,
    headTags: getHeadTags().join('\n'),
    bodyTags: bodyTags.join('\n'),
    app,
  });
};
