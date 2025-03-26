import { HtmlRenderPlugin } from 'html-render-webpack-plugin';
import nanoMemoize from 'nano-memoize';
import debug from 'debug';

import {
  getRouteWithLanguage,
  getValidLanguagesForRoute,
} from '@/utils/language-utils.js';

import type { Stats } from 'webpack';
import type { SkuContext } from '@/context/createSkuContext.js';
import { join } from 'node:path';
import type { RenderableRoute } from '@/types/types.js';

// @ts-expect-error
const { default: memoize } = nanoMemoize;

const log = debug('sku:html-render-plugin');

const getClientStats = (webpackStats: any) => webpackStats.toJson();

const getCachedClientStats = memoize(getClientStats);

// mapStatsToParams runs once for each render. It's purpose is
// to forward the client webpack stats to the render function
const mapStatsToParams =
  ({ publicPath }: { publicPath: string }) =>
  ({ webpackStats }: { webpackStats: Stats }) => {
    const stats = getCachedClientStats(webpackStats);

    return {
      webpackStats: stats,
      publicPath,
    };
  };

const getStartRoutes = ({
  sites,
  routes,
  languages: skuLanguages,
  environments,
}: {
  sites: SkuContext['sites'];
  routes: SkuContext['routes'];
  languages: SkuContext['languages'];
  environments: SkuContext['environments'];
}): RenderableRoute[] => {
  const allRouteCombinations = [];

  const forcedSites = sites.length > 0 ? sites : [undefined];

  for (const route of routes) {
    const routeIsForSpecificSite = typeof route.siteIndex === 'number';
    const languages = getValidLanguagesForRoute({
      route,
      sites,
      languages: skuLanguages,
    });
    for (const language of languages) {
      if (routeIsForSpecificSite) {
        allRouteCombinations.push({
          route,
          site: sites[route.siteIndex!],
          language,
        });
      } else {
        allRouteCombinations.push(
          ...forcedSites.map((site) => ({ site, route, language })),
        );
      }
    }
  }

  return allRouteCombinations.map(({ route, language, site = {} }) => ({
    environment: environments.length > 0 ? environments[0] : '',
    site: site.name || '',
    routeName: route.name || '',
    route: getRouteWithLanguage(route.route, language),
    language: language || '',
    path: '',
  }));
};

export const getBuildRoutes = ({
  sites,
  routes,
  languages: skuLanguages,
  environments,
}: {
  sites: SkuContext['sites'];
  routes: SkuContext['routes'];
  languages: SkuContext['languages'];
  environments: SkuContext['environments'];
}): RenderableRoute[] => {
  const allRouteCombinations = [];

  const forcedEnvs = environments.length > 0 ? environments : [undefined];
  const forcedSites = sites.length > 0 ? sites : [undefined];

  for (const environment of forcedEnvs) {
    for (const route of routes) {
      const routeIsForSpecificSite = typeof route.siteIndex === 'number';
      for (const language of getValidLanguagesForRoute({
        route,
        sites,
        languages: skuLanguages,
      })) {
        log('Using Route', { route, language });
        if (routeIsForSpecificSite) {
          allRouteCombinations.push({
            route,
            site: sites[route.siteIndex!],
            environment,
            language,
          });
        } else {
          allRouteCombinations.push(
            ...forcedSites.map((site) => ({
              site,
              route,
              environment,
              language,
            })),
          );
        }
      }
    }
  }

  return allRouteCombinations.map(
    ({ route, site = {}, language, environment, ...rest }) => ({
      ...rest,
      environment: environment || '',
      site: site.name || '',
      routeName: route.name || '',
      language: language || '',
      route: getRouteWithLanguage(route.route, language),
    }),
  );
};

const startTransformPath = ({ site = '', route = '' }) => join(site, route);

const createHtmlRenderPlugin = ({
  isStartScript,
  skuContext,
}: {
  isStartScript?: boolean;
  skuContext: SkuContext;
}) => {
  const {
    paths,
    routes,
    environments,
    sites,
    transformOutputPath,
    publicPath,
    languages,
  } = skuContext;
  // html-render-webpack-plugin accepts an array of routes to render
  // we create these routes differently for start/build mode
  const allRoutes = isStartScript
    ? getStartRoutes({
        sites,
        routes,
        environments,
        languages,
      })
    : getBuildRoutes({
        sites,
        routes,
        environments,
        languages,
      });

  return new HtmlRenderPlugin({
    renderDirectory: paths.target,
    routes: allRoutes,
    skipAssets: isStartScript,
    transformFilePath: isStartScript ? startTransformPath : transformOutputPath,
    mapStatsToParams: mapStatsToParams({ publicPath }),
    extraGlobals: {
      // Allows Date serialization checks to work in render e.g. `myDate instance Date`
      Date,
    },
  });
};

export default createHtmlRenderPlugin;
