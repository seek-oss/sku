import { HtmlRenderPlugin } from 'html-render-webpack-plugin';
import nanoMemoize from 'nano-memoize';
import debug from 'debug';

import {
  getRouteWithLanguage,
  getValidLanguagesForRoute,
} from '../../../lib/language-utils.js';

import {
  isStartScript,
  paths,
  routes,
  environments,
  sites,
  transformOutputPath,
  publicPath,
} from '../../../context/index.js';
import type { Stats } from 'webpack';

// @ts-expect-error
const { default: memoize } = nanoMemoize;

const log = debug('sku:html-render-plugin');

const getClientStats = (webpackStats: any) => webpackStats.toJson();

const getCachedClientStats = memoize(getClientStats);

// mapStatsToParams runs once for each render. It's purpose is
// to forward the client webpack stats to the render function
const mapStatsToParams = ({ webpackStats }: { webpackStats: Stats }) => {
  const stats = getCachedClientStats(webpackStats);

  return {
    webpackStats: stats,
    publicPath,
  };
};

const getStartRoutes = () => {
  const allRouteCombinations = [];

  const forcedSites = sites.length > 0 ? sites : [undefined];

  for (const route of routes) {
    const routeIsForSpecificSite = typeof route.siteIndex === 'number';
    const languages = getValidLanguagesForRoute(route);
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
    environment: environments.length > 0 ? environments[0] : undefined,
    site: site.name,
    routeName: route.name,
    route: getRouteWithLanguage(route.route, language),
    language,
    path: '',
  }));
};

const getBuildRoutes = () => {
  const allRouteCombinations = [];

  const forcedEnvs = environments.length > 0 ? environments : [undefined];
  const forcedSites = sites.length > 0 ? sites : [undefined];

  for (const environment of forcedEnvs) {
    for (const route of routes) {
      const routeIsForSpecificSite = typeof route.siteIndex === 'number';
      for (const language of getValidLanguagesForRoute(route)) {
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
    ({ route, site = {}, language, ...rest }) => ({
      ...rest,
      site: site.name,
      routeName: route.name,
      language,
      route: getRouteWithLanguage(route.route, language),
    }),
  );
};

const createHtmlRenderPlugin = () => {
  // html-render-webpack-plugin accepts an array of routes to render
  // we create these routes differently for start/build mode
  const allRoutes = isStartScript ? getStartRoutes() : getBuildRoutes();

  return new HtmlRenderPlugin({
    renderDirectory: paths.target,
    routes: allRoutes,
    skipAssets: isStartScript,
    transformFilePath: transformOutputPath,
    mapStatsToParams,
    extraGlobals: {
      // Allows Date serialization checks to work in render e.g. `myDate instance Date`
      Date,
    },
  });
};

export default createHtmlRenderPlugin;
