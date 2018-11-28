const normalizePath = p => p.split('/');

// Returns an express middleware for handling dynamic routes.
// Pass in a list of routes (e.g. ['/some-route/:id']) and it will
// serve requests to the dynamic route (e.g. '/some-route/12345') with
// the static file located at '/some-route/:id/index.html
module.exports = ({
  dynamicRoutes,
  fs,
  rootDirectory,
  dynamicIdentifier = ':'
}) => {
  const dynamicMatches = dynamicRoutes.map(normalizePath);

  return (req, res, next) => {
    const normalizedPath = normalizePath(req.path);

    const routeIndexToServe = dynamicMatches.findIndex(dynamicRoute => {
      if (dynamicRoute.length !== normalizedPath.length) {
        return false;
      }

      const matchCount = dynamicRoute.filter((routePart, index) => {
        if (routePart.startsWith(dynamicIdentifier)) {
          return true;
        }

        return routePart === normalizedPath[index];
      });

      return matchCount.length === dynamicRoute.length;
    });

    if (routeIndexToServe > -1) {
      const htmlFile = fs.readFileSync(
        `${rootDirectory}/${dynamicRoutes[routeIndexToServe]}/index.html`,
        'utf8'
      );

      res.send(htmlFile);
    }

    next();
  };
};
