import { runWithSsrRequestContext } from '#runtime/requestContext';

import { abortReason } from './abortReason.js';
import { collectRouteHeaders } from './collectRouteHeaders.js';
import { createSsrRequestContextStore } from './createSsrRequestContextStore.js';
import { getModuleIds } from './getModuleIds.js';
import { getCspNonce } from './requestContext.js';
import {
  resolveAssets,
  warnUnknownModuleIdsWithoutManifest,
} from './resolveAssets.js';
import { selectForSite } from './selectForSite.js';
import { streamDocument } from './streamDocument.js';
import type {
  DocumentAssets,
  RenderArgs,
  RenderResult,
  SkuRouteHandle,
} from './types.js';

export type { RenderArgs } from './types.js';

const renderDocument = async ({
  siteStaticHandlers,
  request,
  req,
  assets,
  getSite,
  getLanguage,
  getClientContext,
  getReactContext,
  options = {},
  renderManifest,
  getRouterContext,
}: RenderArgs): Promise<RenderResult> => {
  if (options.signal?.aborted) {
    throw abortReason(options.signal);
  }

  // Call order before query(): site → language → clientContext → reactContext → routerContext.
  const site = getSite ? getSite({ req }) : Object.keys(siteStaticHandlers)[0];
  const language = getLanguage?.({ req });
  const clientContext = getClientContext?.({ req });
  const reactContext = getReactContext?.({ req, site, clientContext });

  const { query, dataRoutes } = selectForSite(
    siteStaticHandlers,
    site,
    getSite ? 'getSite' : 'config sites',
  );

  const requestContext = getRouterContext
    ? await getRouterContext({
        request,
        req,
        site,
        clientContext,
        reactContext,
      })
    : undefined;
  const context = await query(
    request,
    requestContext ? { requestContext } : undefined,
  );

  if (options.signal?.aborted) {
    throw abortReason(options.signal);
  }

  if (context instanceof Response) {
    return { response: context };
  }

  const development = options.development ?? false;
  const moduleIds = getModuleIds(context.matches, {
    development,
    requestLanguage: language,
  });
  let documentAssets: DocumentAssets = {
    css: assets.css,
    modulePreloads: assets.modulePreloads,
  };
  if (renderManifest) {
    documentAssets = resolveAssets({
      manifest: renderManifest.manifest,
      publicPath: renderManifest.publicPath,
      entry: renderManifest.entry,
      moduleIds,
      development,
    });
  } else if (development) {
    // No client manifest in middleware-mode; validate path-like ids on disk.
    warnUnknownModuleIdsWithoutManifest(moduleIds);
  }

  const routeHeaders = collectRouteHeaders(context);
  const waitForAll = context.matches.some(
    ({ route }) =>
      (route.handle as SkuRouteHandle | undefined)?.waitForAll === true,
  );

  // Mint when attaching nonce to React stream scripts (unhashable post-shell).
  // Consumers may already have requested the same value via getCspNonce / req.getCspNonce.
  const nonce = getCspNonce() ?? options.nonce;

  return streamDocument({
    renderContext: context,
    dataRoutes,
    documentAssets,
    assets,
    site,
    clientContext,
    reactContext,
    routeHeaders,
    waitForAll,
    nonce,
    options,
  });
};

export const render = ({
  options = {},
  ...args
}: RenderArgs): Promise<RenderResult> => {
  // Async Local Storage must be established in this Vite-loaded module so consumer
  // helpers (also resolved via the SSR module graph) share the store.
  const store =
    options.requestContextStore ?? createSsrRequestContextStore(options.nonce);
  return runWithSsrRequestContext(store, () =>
    renderDocument({
      ...args,
      options: { ...options, requestContextStore: store },
    }),
  );
};
