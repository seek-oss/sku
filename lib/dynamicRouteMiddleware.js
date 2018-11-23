const normalizePath = p => p.split('/');

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

    if (routeIndexToServe < 0) {
      next();
    }

    const htmlFile = fs.readFileSync(
      `${rootDirectory}/${dynamicRoutes[routeIndexToServe]}/index.html`,
      'utf8'
    );

    res.send(htmlFile);
  };
};
