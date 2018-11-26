const { partition } = require('lodash');
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

const createPublicUrl = (publicPath, asset) => {
  const host = publicPath.endsWith('/') ? publicPath : `${publicPath}/`;

  return `${host}${asset}`;
};

const mapStatsToParams = ({ webpackStats, routeName }) => {
  const { entrypoints } = webpackStats
    .toJson()
    .children.find(({ name }) => name === 'client');
  const assets = entrypoints[routeName]
    ? entrypoints[routeName].assets
    : entrypoints[defaultClientEntry].assets;

  const [styles, scripts] = partition(assets, asset => asset.endsWith('.css'));
  const bodyTags = scripts
    .map(
      chunkFile =>
        `<script type="text/javascript" src="${createPublicUrl(
          paths.publicPath,
          chunkFile
        )}"></script>`
    )
    .join('\n');
  const headTags = styles
    .map(
      chunkFile =>
        `<link rel="stylesheet" type="text/css" href="${createPublicUrl(
          paths.publicPath,
          chunkFile
        )}" />`
    )
    .join('\n');

  return {
    headTags,
    bodyTags
  };
};

const getStartRoutes = () => {
  writeStartConfig(environments[0], sites[0]);

  return routes.map(({ name, route }) => ({
    routeName: name,
    route
  }));
};

const getBuildRoutes = () =>
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
  return new HtmlRenderPlugin({
    renderDirectory: paths.target,
    routes: isStartScript ? getStartRoutes() : getBuildRoutes(),
    transformFilePath: transformOutputPath,
    mapStatsToParams,
    verbose: false
  });
};
