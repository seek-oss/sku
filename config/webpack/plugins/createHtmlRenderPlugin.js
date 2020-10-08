const HtmlRenderPlugin = require('html-render-webpack-plugin');
const memoize = require('memoizee/weak');

const {
  isStartScript,
  paths,
  routes,
  environments,
  sites,
  transformOutputPath,
  publicPath,
} = require('../../../context');

const getClientStats = (webpackStats) => webpackStats.toJson();

const getCachedClientStats = memoize(getClientStats);

// mapStatsToParams runs once for each render. It's purpose is
// to forward the client webpack stats to the render function
const mapStatsToParams = ({ webpackStats }) => {
  const stats = getCachedClientStats(webpackStats);

  return {
    webpackStats: stats,
    publicPath,
  };
};

const getStartRoutes = () => {
  const allRouteCombinations = [];

  for (const route of routes) {
    if (typeof route.siteIndex === 'number') {
      allRouteCombinations.push({ route, site: sites[route.siteIndex] });
    } else {
      allRouteCombinations.push(...sites.map((site) => ({ site, route })));
    }
  }

  return allRouteCombinations.map(({ route, site = {} }) => ({
    environment: environments.length > 0 ? environments[0] : undefined,
    site: site.name,
    routeName: route.name,
    route: route.route,
  }));
};

const getBuildRoutes = () => {
  const allRouteCombinations = [];

  const hackEnvs = environments.length > 0 ? environments : [undefined];
  const hackSites = sites.length > 0 ? sites : [undefined];

  for (const environment of hackEnvs) {
    for (const route of routes) {
      if (typeof route.siteIndex === 'number') {
        allRouteCombinations.push({
          route,
          site: sites[route.siteIndex],
          environment,
        });
      } else {
        allRouteCombinations.push(
          ...hackSites.map((site) => ({ site, route, environment })),
        );
      }
    }
  }
  console.log(allRouteCombinations);

  return allRouteCombinations.map(({ route, site = {}, ...rest }) => ({
    ...rest,
    site: site.name,
    routeName: route.name,
    route: route.route,
  }));
};

module.exports = () => {
  const theRoutes = isStartScript ? getStartRoutes() : getBuildRoutes();

  console.log(theRoutes);

  // html-render-webpack-plugin accepts an array of routes to render
  // we create these routes differently for start/build mode
  return new HtmlRenderPlugin({
    renderDirectory: paths.target,
    routes: theRoutes,
    skipAssets: isStartScript,
    transformFilePath: transformOutputPath,
    mapStatsToParams,
    extraGlobals: {
      // This fixes an issue where one of treats deps (@hapi/joek)
      // accesses Buffer globally. Not great...
      Buffer,
    },
  });
};
