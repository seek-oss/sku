import type { Collector } from '@/services/vite/loadable/collector.js';
import { LoadableProvider } from '@/services/vite/loadable/index.js';
import { renderToStringAsync } from '@/services/webpack/entry/render/render-to-string.js';
import debug from 'debug';
import type { ReactNode } from 'react';

import type { Render, RenderAppProps } from '@/types/types.js';
import { serializeConfig } from '../serializeConfig.js';

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

  const app = await render.renderApp?.({
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

  if (app === undefined) {
    // there is no `renderApp` function. Throw for now.
    log('No renderApp function provided');
    throw new Error(
      'No renderApp function provided when trying to render html',
    );
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

  const result = await render.renderDocument({
    ...renderContext,
    headTags: getHeadTags().join('\n'),
    bodyTags: bodyTags.join('\n'),
    app,
  });

  return result;
};
