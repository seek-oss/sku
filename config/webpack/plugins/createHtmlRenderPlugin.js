const HtmlRenderPlugin = require('html-render-webpack-plugin');

const product = require('../../../lib/product');
const {
  isStartScript,
  paths,
  routes,
  environments,
  sites,
  transformOutputPath,
  publicPath,
} = require('../../../context');

// mapStatsToParams runs once for each render. It's purpose is
// to forward the client webpack stats to the render function
const mapStatsToParams = ({ webpackStats }) => {
  const stats = webpackStats
    .toJson()
    .children.find(({ name }) => name === 'client');

  return {
    webpackStats: stats,
    publicPath,
  };
};

const getStartRoutes = () => {
  // product creates a new array featuring every possible combination
  // of parameters. This is used to ensure we have a specific HTML file for
  // every combination of site & route. Environment is always the
  // first option in start mode.
  return product({
    site: sites,
    route: routes,
  }).map(({ route, site = {} }) => ({
    environment: environments.length > 0 ? environments[0] : undefined, // eslint-disable-line no-undefined
    site: site.name,
    routeName: route.name,
    route: route.route,
  }));
};

const getBuildRoutes = () =>
  // product creates a new array featuring every possible combination
  // of parameters. This is used to ensure we have a specific HTML file for
  // every combination of site, environment & route
  product({
    environment: environments,
    site: sites,
    route: routes,
  }).map(({ route, site = {}, ...rest }) => ({
    ...rest,
    site: site.name,
    routeName: route.name,
    route: route.route,
  }));

module.exports = () => {
  // html-render-webpack-plugin accepts an array of routes to render
  // we create these routes differently for start/build mode
  return new HtmlRenderPlugin({
    renderDirectory: paths.target,
    routes: isStartScript ? getStartRoutes() : getBuildRoutes(),
    transformFilePath: transformOutputPath,
    mapStatsToParams,
    verbose: false,
  });
};
