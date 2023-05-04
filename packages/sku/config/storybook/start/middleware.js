const { paths, useDevServerMiddleware } = require('../../../context');

const dummyMiddleware = (app) => app;
let middleware = dummyMiddleware;

if (useDevServerMiddleware) {
  middleware = require(paths.devServerMiddleware);
}

module.exports = middleware;
