const path = require('path');
const http = require('http');
const handler = require('serve-handler');
const partition = require('lodash/partition');
const { blue, bold, underline, yellow, red } = require('chalk');

const {
  port,
  paths,
  environments,
  initialPath,
  routes,
  sites,
} = require('../context');
const { checkHosts, getAppHosts } = require('../lib/hosts');
const allocatePort = require('../lib/allocatePort');
const openBrowser = require('../lib/openBrowser');
const getSiteForHost = require('../lib/getSiteForHost');
const args = require('../config/args').argv;

const environment = args.environment ? args.environment : environments[0] || '';

(async () => {
  if (
    paths.publicPath.startsWith('http') ||
    paths.publicPath.startsWith('//')
  ) {
    console.log(
      red('sku serve not supported when publicPath is on a separate domain.'),
    );
    process.exit(1);
  }

  await checkHosts();

  const appHosts = getAppHosts();

  const availablePort = await allocatePort({
    port: port.client,
    host: '0.0.0.0',
  });

  console.log(blue(`sku serve`));

  if (environment) {
    console.log(`Using ${bold(environment)} environment`);
  }

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
    const [hostname] = request.headers.host.split(':');

    const site = getSiteForHost(hostname) || '';

    const rewrites = validRoutes.map(({ route }) => {
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

    if (paths.publicPath !== '/') {
      rewrites.push({
        source: path.join(paths.publicPath, ':asset+.:extension'),
        destination: '/:asset.:extension',
      });
    }

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

    const sitesWithHosts = sites.filter((site) => site.host);

    if (sitesWithHosts.length > 0) {
      sitesWithHosts.forEach((site) => {
        const siteUrl = `http://${site.host}:${availablePort}${initialPath}`;

        console.log(
          blue(`${bold(site.name)} site available at ${underline(siteUrl)}`),
        );
      });
    } else {
      console.log(blue(`Started server on ${underline(url)}`));
    }

    console.log();

    openBrowser(url);
  });
})();
