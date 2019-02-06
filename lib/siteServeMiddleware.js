const path = require('path');
const debug = require('debug')('sku:siteServeMiddleware');

const context = require('../context');

const normalizePath = p => p.split('/');

const findSkuRoute = (routes, req) => {
  const dynamicRoutes = routes
    .filter(({ route }) => /\:/.test(route))
    .map(({ route }) => route);

  const dynamicMatches = dynamicRoutes.map(normalizePath);

  const normalizedPath = normalizePath(req.path);

  const routeIndexToServe = dynamicMatches.findIndex(dynamicRoute => {
    if (dynamicRoute.length !== normalizedPath.length) {
      return false;
    }

    const matchCount = dynamicRoute.filter((routePart, index) => {
      if (routePart.startsWith(':')) {
        return true;
      }

      return routePart === normalizedPath[index];
    });

    return matchCount.length === dynamicRoute.length;
  });

  return routeIndexToServe !== -1 ? dynamicRoutes[routeIndexToServe] : req.path;
};

const findSitePrefix = (sites, req) => {
  if (sites.length === 0) {
    return '';
  }

  const matchingSite = sites.find(site => site.host === req.hostname);

  return matchingSite ? matchingSite.name : sites[0].name;
};

module.exports = ({
  fs,
  routes = context.routes,
  sites = context.sites,
  rootDirectory = context.paths.target,
  transformOutputPath = context.transformOutputPath
}) => (req, res, next) =>
  new Promise(resolve => {
    const fileToServe = path.join(
      rootDirectory,
      transformOutputPath({
        site: findSitePrefix(sites, req),
        route: findSkuRoute(routes, req)
      }),
      'index.html'
    );

    fs.readFile(fileToServe, 'utf8', (err, file) => {
      if (err) {
        debug('No matching file', fileToServe);

        next();
      } else {
        res.send(file);
      }

      resolve();
    });
  });
