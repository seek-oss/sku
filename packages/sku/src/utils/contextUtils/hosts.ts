import { promisify } from 'node:util';
import { set, get } from 'hostile';
import chalk from 'chalk';

import { suggestScript } from '../suggestScript.js';
import { hasErrorCode } from '../error-guards.js';
import type { SkuContext } from '@/context/createSkuContext.js';

const setSystemHost = promisify(set);
const getSystemHosts = promisify(get);

export const getAppHosts = ({ sites: configuredSites, hosts }: SkuContext) =>
  configuredSites
    .filter((site) => site.host)
    .map((site) => site.host)
    .concat(hosts);

export const setupHosts = async (skuContext: SkuContext) => {
  try {
    const appHosts = getAppHosts(skuContext).filter(
      (host) => host !== 'localhost',
    );

    for (const host of appHosts) {
      if (host) {
        await setSystemHost('127.0.0.1', host);
        console.log(
          `Successfully added '${chalk.bold(host)}' to your hosts file`,
        );
      }
    }
  } catch (e: unknown) {
    if (hasErrorCode(e) && e.code === 'EACCES') {
      console.log(
        chalk.red('Error: setup-hosts must be run with root privileges'),
      );
    } else {
      console.error(e);
    }

    throw e;
  }
};

const getMissingHosts = async (skuContext: SkuContext) => {
  const systemHosts = await getSystemHosts(false);
  const appHosts = getAppHosts(skuContext);

  return appHosts.filter(
    (appHost) => !systemHosts.find(([_, host]) => appHost === host),
  );
};

export const checkHosts = async (skuContext: SkuContext) => {
  try {
    const missingHosts = await getMissingHosts(skuContext);

    if (missingHosts.length > 0) {
      missingHosts.forEach((appHost) => {
        console.log(
          chalk.yellow(
            `Host '${chalk.bold(appHost)}' is not configured in your hosts file`,
          ),
        );
      });

      suggestScript('setup-hosts', { sudo: true });
    }
  } catch {
    // swallow error as this just a warning check
  }
};
