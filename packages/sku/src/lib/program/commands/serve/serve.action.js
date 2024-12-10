import { join } from 'node:path';
import exists from '../../../exists.js';
import express from 'express';
import handler from 'serve-handler';
import chalk from 'chalk';
import didYouMean from 'didyoumean2';

import {
  port,
  paths,
  initialPath,
  routes,
  sites,
  useDevServerMiddleware,
  httpsDevServer,
} from '../../../../context/index.js';
import { checkHosts, getAppHosts } from '../../../hosts.js';
import allocatePort from '../../../allocatePort.js';
import openBrowser from '../../../openBrowser/index.js';
import getSiteForHost from '../../../getSiteForHost.js';
import { resolveEnvironment } from '../../../resolveEnvironment.js';
import provider from '../../../../telemetry/index.js';
import createServer from '../../../createServer.js';
import {
  getRouteWithLanguage,
  getValidLanguagesForRoute,
} from '../../../language-utils.js';
import {
  configureProject,
  validatePeerDeps,
} from '../../../utils/configure.js';

export const serveAction = async ({
  site: preferredSite,
  port: preferredPort,
  environment: environmentOption,
}) => {
  await configureProject();
  validatePeerDeps();
  provider.count('serve');

  const targetFolderExists = await exists(paths.target);

  if (!targetFolderExists) {
    console.log(
      chalk.red(
        `${chalk.bold('sku build')} must be run before running ${chalk.bold('sku serve')}`,
      ),
    );
    process.exit(1);
  }

  const availableSites = sites.map(({ name }) => name);

  if (preferredSite && !availableSites.some((site) => preferredSite === site)) {
    console.log(chalk.red(`Unknown site '${chalk.bold(preferredSite)}'`));
    const suggestedSite = didYouMean(preferredSite, availableSites);

    if (suggestedSite) {
      console.log(`Did you mean '${chalk.bold(suggestedSite)}'?`);
    }

    process.exit(1);
  }

  if (
    paths.publicPath.startsWith('http') ||
    paths.publicPath.startsWith('//')
  ) {
    console.log(
      chalk.red(
        'sku serve not supported when publicPath is on a separate domain.',
      ),
    );
    process.exit(1);
  }

  await checkHosts();

  const appHosts = getAppHosts();

  const availablePort = await allocatePort({
    port: preferredPort || port.client,
    host: '0.0.0.0',
  });

  console.log(chalk.blue(`sku serve`));

  const environment = resolveEnvironment({ environment: environmentOption });

  const app = express();

  if (useDevServerMiddleware) {
    const devServerMiddleware = (await import(paths.devServerMiddleware))
      .default;
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
          destination: join(
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
        source: join(paths.publicPath, ':asset+.:extension'),
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
          chalk.blue(
            `${chalk.bold(site.name)} site available at ${chalk.underline(siteUrl)}`,
          ),
        );
      });
    } else {
      console.log(chalk.blue(`Started server on ${chalk.underline(url)}`));
    }

    console.log();

    openBrowser(url);
  });
};