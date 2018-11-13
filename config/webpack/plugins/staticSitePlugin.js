const path = require('path');
const { flatMap, partition } = require('lodash');
const MultiStaticRenderPlugin = require('multi-static-render-webpack-plugin');

const {
  isStartScript,
  paths,
  routes,
  environments,
  sites,
  transformPath,
  defaultClientEntry
} = require('../../../context');

const debugStats = clientStats => {
  require('fs').writeFileSync(
    require('path').join(process.cwd(), 'client-stats.json'),
    JSON.stringify(clientStats)
  );
};

const mapStatsToParams = ({ clientStats, routeName }) => {
  // debugStats(clientStats);
  const assets = clientStats[routeName]
    ? clientStats[routeName].assets
    : clientStats[defaultClientEntry].assets;

  const [styles, scripts] = partition(assets, asset => asset.endsWith('.css'));
  const bodyTags = scripts
    .map(
      chunkFile =>
        `<script type="text/javascript" src="${path.join(
          paths.publicPath,
          chunkFile
        )}"></script>`
    )
    .join('\n');
  const headTags = styles
    .map(
      chunkFile =>
        `<link rel="stylesheet" type="text/css" href="${path.join(
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

const getStartRoutes = () => {};

const getBuildRoutes = () =>
  flatMap(environments, environment =>
    flatMap(sites, site =>
      flatMap(routes, ({ name, route }) => ({
        environment,
        site,
        routeName: name,
        route: transformPath({ environment, site, route })
      }))
    )
  );

module.exports = () => {
  return new MultiStaticRenderPlugin({
    renderDirectory: paths.target,
    routes: isStartScript ? getStartRoutes() : getBuildRoutes(),
    mapStatsToParams,
    verbose: true
  });
};
