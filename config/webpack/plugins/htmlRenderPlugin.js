const { flatMap, partition } = require('lodash');
const HtmlRenderPlugin = require('html-render-webpack-plugin');

const { writeStartConfig } = require('../utils/startConfig');

const {
  isStartScript,
  paths,
  routes,
  environments,
  sites,
  transformPath,
  defaultClientEntry
} = require('../../../context');

const createPublicUrl = (publicPath, asset) => {
  const host = publicPath.endsWith('/') ? publicPath : `${publicPath}/`;

  return `${host}${asset}`;
};

const mapStatsToParams = ({ clientStats, routeName }) => {
  const { entrypoints } = clientStats;
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
  flatMap(environments, environment =>
    flatMap(sites, site =>
      flatMap(routes, ({ name, route }) => ({
        environment,
        site,
        routeName: name,
        route
      }))
    )
  );

module.exports = () => {
  return new HtmlRenderPlugin({
    renderDirectory: paths.target,
    routes: isStartScript ? getStartRoutes() : getBuildRoutes(),
    transformFilePath: transformPath,
    mapStatsToParams,
    verbose: false
  });
};
