const { pathToRegexp } = require('path-to-regexp');

module.exports = (route) => {
  const normalisedRoute = route
    .split('/')
    .map((part) => {
      if (part.startsWith('$')) {
        // Path is dynamic, map to ':id' style syntax supported by pathToRegexp
        return `:${part.slice(1)}`;
      }

      return part;
    })
    .join('/');

  const keys = [];
  const regexp = pathToRegexp(normalisedRoute, keys);

  return (path) => {
    const result = regexp.exec(path);

    const params = {};

    if (result) {
      keys.forEach((key, index) => {
        Object.assign(params, { [key.name]: result[index + 1] });
      });
    }

    return {
      match: Boolean(result),
      params,
    };
  };
};
