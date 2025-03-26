import chalk from 'chalk';

import { suggestScript } from '../suggestScript.js';
import { hasErrorCode } from '../error-guards.js';
import type { SkuContext } from '@/context/createSkuContext.js';
import { promisify } from 'node:util';
import { set, get } from 'hostile';

type Line = string | [string, /* host */ string /* ip */];
type SetSystemHostFunction = (ip: string, host: string) => Promise<void>;
type GetSystemHostFunction = (preserveFormatting: boolean) => Promise<Line[]>;

type HostSystemActions = {
  setSystemHost: SetSystemHostFunction;
  getSystemHosts: GetSystemHostFunction;
};

export const getAppHosts = ({ sites: configuredSites, hosts }: SkuContext) =>
  configuredSites
    .filter((site) => site.host)
    .map((site) => site.host)
    .concat(hosts);

export const setupHosts =
  ({ setSystemHost }: HostSystemActions) =>
  async (skuContext: SkuContext): Promise<void> => {
    try {
      const appHosts = getAppHosts(skuContext).filter(
        (host) => host !== 'localhost',
      );

      for (const host of appHosts) {
        if (host) {
          await setSystemHost('127.0.0.1', host);
          await setSystemHost('::1', host);
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

export const checkHosts =
  ({ getSystemHosts }: HostSystemActions) =>
  async (skuContext: SkuContext): Promise<void> => {
    const systemHosts = await getSystemHosts(false);
    const missingHosts = getAppHosts(skuContext).filter(
      (appHost) => !systemHosts.find(([_, host]) => appHost === host),
    );

    try {
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

/**
 * Inject `hostile` actions into a function that requires host file manipulation.
 */
export const withHostile = <T>(fn: (system: HostSystemActions) => T): T =>
  fn({
    getSystemHosts: promisify(get),
    setSystemHost: promisify(set),
  });
