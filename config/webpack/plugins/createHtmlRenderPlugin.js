const HtmlRenderPlugin = require('html-render-webpack-plugin');

const { writeStartConfig } = require('../utils/startConfig');
const product = require('../../../lib/product');
const {
  isStartScript,
  paths,
  routes,
  environments,
  sites,
  transformOutputPath,
  defaultClientEntry
} = require('../../../context');

// mapStatsToParams runs once for each render. It's purpose is
// to create the relevant asset tags required for each route.
// Each entrypoint maps back to a route specific entry or the default client entry
const mapStatsToParams = ({ webpackStats, routeName }) => {
  const stats = webpackStats
    .toJson()
    .children.find(({ name }) => name === 'client');
  const entrypoint = stats.entrypoints[routeName]
    ? routeName
    : defaultClientEntry;

  return {
    webpackStats: stats,
    entrypoint
  };
};

const getStartRoutes = () => {
  // Create a dynamic file for use in start mode containing
  // environment and site config. This allows us to change
  // the environment/site without restarting the dev server
  writeStartConfig(environments[0], sites[0]);

  // Start mode needs one render pass per route
  return routes.map(({ name, route }) => ({
    routeName: name,
    route
  }));
};

const getBuildRoutes = () =>
  // product creates a new array featuring every possible combination
  // of parameters. This is used to ensure we have a specific HTML file for
  // every combination of site, environment & route
  product({
    environment: environments,
    site: sites,
    route: routes
  }).map(({ route, ...rest }) => ({
    ...rest,
    routeName: route.name,
    route: route.route
  }));

module.exports = () => {
  // html-render-webpack-plugin accepts an array of routes to render
  // we create these routes differently for start/build mode
  return new HtmlRenderPlugin({
    renderDirectory: paths.target,
    routes: isStartScript ? getStartRoutes() : getBuildRoutes(),
    transformFilePath: transformOutputPath,
    mapStatsToParams,
    verbose: false
  });
};
