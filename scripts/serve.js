const path = require('path');
const express = require('express');
const fs = require('fs-extra');
const handler = require('serve-handler');
const flatMap = require('lodash/flatMap');
const { blue, bold, underline, red } = require('chalk');
const didYouMean = require('didyoumean2').default;
const minimatch = require('minimatch');

console.log(minimatch(':id', '*id'));

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

const prefferedSite = args.site;

(async () => {
  track.count('serve');

  const targetFolderExists = fs.existsSync(paths.target);

  if (!targetFolderExists) {
    console.log(
      red(
        `${bold('sku build')} must be run before running ${bold('sku serve')}`,
      ),
    );
    process.exit(1);
  }

  const availableSites = sites.map(({ name }) => name);

  if (prefferedSite && !availableSites.some((site) => prefferedSite === site)) {
    console.log(red(`Unknown site '${bold(prefferedSite)}'`));
    const suggestedSite = didYouMean(prefferedSite, availableSites);

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

    const site = getSiteForHost(hostname, prefferedSite) || '';

    const rewrites = flatMap(routes, (route) =>
      getValidLanguagesForRoute(route).map((lang) => {
        const langRoute = getRouteWithLanguage(route.route, lang);

        const normalisedRoute = langRoute
          .split('/')
          .map((part) => {
            if (part.startsWith('$') || part.startsWith(':')) {
              // Match the literal value because that's what sku outputs
              return `\\${part}`;
            }

            return part;
          })
          .join('/');

        return {
          source: langRoute,
          destination: path.join(
            environment,
            site,
            normalisedRoute,
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
