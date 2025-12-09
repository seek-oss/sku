import { join } from 'node:path';
import exists from '../../../utils/exists.js';
import express from 'express';
import handler from 'serve-handler';
import chalk from 'chalk';
import { closest } from 'fastest-levenshtein';
import {
  checkHosts,
  getAppHosts,
  withHostile,
} from '../../../context/hosts.js';
import allocatePort from '../../../utils/allocatePort.js';
import { openBrowser } from '../../../openBrowser.js';
import { getSiteForHost } from '../../../context/getSiteForHost.js';
import { resolveEnvironment } from '../../../context/resolveEnvironment.js';
import provider from '../../../services/telemetry/index.js';
import createServer from '../../../utils/createServer.js';
import {
  getRouteWithLanguage,
  getValidLanguagesForRoute,
} from '../../../utils/language-utils.js';
import {
  configureProject,
  validatePeerDeps,
} from '../../../utils/configure.js';
import type { SkuContext } from '../../../context/createSkuContext.js';
import { serverUrls } from '@sku-private/utils';

export const serveAction = async ({
  site: preferredSite,
  environment: environmentOption,
  skuContext,
}: {
  site: string;
  environment: string;
  skuContext: SkuContext;
}) => {
  const {
    port,
    paths,
    initialPath,
    routes,
    sites,
    httpsDevServer,
    hosts,
    languages,
  } = skuContext;
  await configureProject(skuContext);
  validatePeerDeps(skuContext);
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
    const suggestedSite = closest(preferredSite, availableSites);

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

  await withHostile(checkHosts)(skuContext);

  const appHosts = getAppHosts(skuContext);

  const availablePort = await allocatePort({
    port: port.client,
    host: '0.0.0.0',
    strictPort: port.strictPort,
  });

  console.log(chalk.blue(`sku serve`));

  const environment = resolveEnvironment({
    environment: environmentOption,
    skuContext,
  });

  const app = express();

  if (paths.devServerMiddleware) {
    const devServerMiddleware = (await import(paths.devServerMiddleware))
      .default;
    if (devServerMiddleware && typeof devServerMiddleware === 'function') {
      devServerMiddleware(app);
    }
  }

  app.use((request, response) => {
    const [hostname] = request.headers.host?.split(':') || [];

    const site = getSiteForHost(hostname, preferredSite, sites) || '';

    const rewrites = routes.flatMap((route) =>
      getValidLanguagesForRoute({ route, sites, languages }).map((lang) => {
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

  const server = await createServer({
    requestListener: app,
    httpsDevServer,
    hosts,
  });

  // @ts-expect-error This seems to have never been a valid event handler, but leaving it here so as
  // not to accidentally break anything
  app.on('error', console.error);

  server.listen(availablePort, () => {
    const preferredHost = sites.find(
      ({ name }) => name === preferredSite,
    )?.host;
    const urls = serverUrls({
      // Sort the preferred host to the top of the list
      hosts: !preferredHost
        ? appHosts
        : appHosts.sort((a, b) => {
            if (a === preferredHost) {
              return -1;
            }
            if (b === preferredHost) {
              return 1;
            }
            return 0;
          }),
      port: availablePort,
      initialPath,
      https: httpsDevServer,
    });

    console.log(chalk.blue('Server started'));
    if (skuContext.listUrls) {
      urls.printAll();
    } else {
      urls.print();
    }

    console.log();

    openBrowser(urls.first());
  });
};
