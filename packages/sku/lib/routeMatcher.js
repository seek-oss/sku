const { match } = require('path-to-regexp');

/**
 * @param {string} route
 * */
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

  return match(normalisedRoute);
};
