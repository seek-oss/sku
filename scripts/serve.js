const path = require('path');
const http = require('http');
const handler = require('serve-handler');
const partition = require('lodash/partition');
const { blue, bold, underline, yellow } = require('chalk');

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

  const [invalidRoutes, validRoutes] = partition(
    routes,
    ({ route }) => route.indexOf(':') > -1,
  );

  if (invalidRoutes.length > 0) {
    console.log(yellow(`Invalid dynamic routes:\n`));

    invalidRoutes.forEach(({ route }) => {
      console.log(yellow(underline(route)));
    });

    console.log(
      yellow(
        `\n${bold(
          'sku serve',
        )} doesn't support dynamic routes using ':' style syntax.\nPlease upgrade your routes to use '$' instead.`,
      ),
    );
  }

  const server = http.createServer((request, response) => {
    const site = getSiteForHost(request.hostname) || '';

    const routeRewrites = validRoutes.map(({ route }) => {
      const normalisedRoute = route
        .split('/')
        .map((part) => {
          if (part.startsWith('$')) {
            // Path is dynamic, map part to * match
            return '*';
          }

          return part;
        })
        .join('/');

      return {
        source: normalisedRoute,
        destination: path.join(environment, site, route, 'index.html'),
      };
    });

    const rewrites = [
      ...routeRewrites,
      {
        source: path.join(paths.publicPath, ':asset+.:extension'),
        destination: '/:asset.:extension',
      },
    ];

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
