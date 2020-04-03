const path = require('path');
const http = require('http');
const handler = require('serve-handler');
const { blue, underline } = require('chalk');

const {
  port,
  paths,
  environments,
  initialPath,
  routes,
} = require('../context');
const { checkHosts, getAppHosts } = require('../lib/hosts');
const allocatePort = require('../lib/allocatePort');
const openBrowser = require('../lib/openBrowser');
const getSiteForHost = require('../lib/getSiteForHost');
const args = require('../config/args').argv;

const environment = args.environment ? args.environment : environments[0] || '';

console.log({ environment, target: paths.relativeTarget });

(async () => {
  await checkHosts();

  const appHosts = getAppHosts();

  const availablePort = await allocatePort({
    port: port.client,
    host: '0.0.0.0',
  });

  const server = http.createServer((request, response) => {
    const site = getSiteForHost(request.hostname) || '';

    const routeRewrites = routes.map(({ route }) => {
      return {
        source: route,
        destination: path.join(environment, site, route, 'index.html'),
      };
    });

    const rewrites = [
      ...routeRewrites,
      // {
      //   source: path.join(paths.publicPath, ':asset+.:extension'),
      //   destination: '/:asset.:extension',
      // },
    ];

    console.log(rewrites);

    return handler(request, response, {
      rewrites,
      public: paths.relativeTarget,
      directoryListing: false,
      headers: [
        {
          source: '**/*.*',
          headers: [
            {
              key: 'Access-Control-Allow-Origin',
              value: '*',
            },
          ],
        },
      ],
    });
  });

  server.listen(availablePort, () => {
    const url = `http://${appHosts[0]}:${availablePort}${initialPath}`;

    console.log();
    console.log(blue(`Started server on ${underline(url)}`));
    console.log();

    openBrowser(url);
  });
})();
