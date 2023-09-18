const path = require('node:path');
const exists = require('../lib/exists');
const express = require('express');
const handler = require('serve-handler');
const { blue, bold, underline, red } = require('chalk');
const didYouMean = require('didyoumean2').default;

const {
  port,
  paths,
  initialPath,
  routes,
  sites,
  useDevServerMiddleware,
  httpsDevServer,
} = require('../context');
const { checkHosts, getAppHosts } = require('../lib/hosts');
const allocatePort = require('../lib/allocatePort');
const openBrowser = require('../lib/openBrowser');
const getSiteForHost = require('../lib/getSiteForHost');
const resolveEnvironment = require('../lib/resolveEnvironment');
const args = require('../config/args');
const track = require('../telemetry');
const createServer = require('../lib/createServer');
const {
  getRouteWithLanguage,
  getValidLanguagesForRoute,
} = require('../lib/language-utils');

const preferredSite = args.site;

(async () => {
  track.count('serve');

  const targetFolderExists = await exists(paths.target);

  if (!targetFolderExists) {
    console.log(
      red(
        `${bold('sku build')} must be run before running ${bold('sku serve')}`,
      ),
    );
    process.exit(1);
  }

  const availableSites = sites.map(({ name }) => name);

  if (preferredSite && !availableSites.some((site) => preferredSite === site)) {
    console.log(red(`Unknown site '${bold(preferredSite)}'`));
    const suggestedSite = didYouMean(preferredSite, availableSites);

    if (suggestedSite) {
      console.log(`Did you mean '${bold(suggestedSite)}'?`);
    }

    process.exit(1);
  }

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
    port: args.port || port.client,
    host: '0.0.0.0',
  });

  console.log(blue(`sku serve`));

  const environment = resolveEnvironment();

  const app = express();

  if (useDevServerMiddleware) {
    const devServerMiddleware = require(paths.devServerMiddleware);
    if (devServerMiddleware && typeof devServerMiddleware === 'function') {
      devServerMiddleware(app);
    }
  }

  app.use((request, response) => {
    const [hostname] = request.headers.host.split(':');

    const site = getSiteForHost(hostname, preferredSite) || '';

    const rewrites = routes.flatMap((route) =>
      getValidLanguagesForRoute(route).map((lang) => {
        const langRoute = getRouteWithLanguage(route.route, lang);

        // $ and : are both acceptable dynamic path delimiters
        const normalisedSourceRoute = langRoute
          .split('/')
          .map((part) => {
            if (part.startsWith('$') || part.startsWith(':')) {
              // Path is dynamic, map part to * match
              return '*';
            }

            return part;
          })
          .join('/');

        // Segments with : need to be escaped though, because serve expects there to be an equivalent in source
        const normalisedDestinationRoute = langRoute
          .split('/')
          .map((part) => (part.startsWith(':') ? `\\${part}` : part))
          .join('/');

        return {
          source: normalisedSourceRoute,
          destination: path.join(
            environment,
            site,
            normalisedDestinationRoute,
            'index.html',
          ),
        };
      }),
    );

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

  const server = await createServer(app);

  app.on('error', console.error);

  server.listen(availablePort, () => {
    const proto = httpsDevServer ? 'https' : 'http';
    const url = `${proto}://${appHosts[0]}:${availablePort}${initialPath}`;

    console.log();

    const sitesWithHosts = sites.filter((site) => site.host);

    if (sitesWithHosts.length > 0) {
      sitesWithHosts.forEach((site) => {
        const siteUrl = `${proto}://${site.host}:${availablePort}${initialPath}`;

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
