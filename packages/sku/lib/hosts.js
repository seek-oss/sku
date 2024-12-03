import { promisify } from 'node:util';
import { set, get } from 'hostile';
import { red, yellow, bold } from 'chalk';

import { hosts, sites as contextSites } from '../context';
import { suggestScript } from './suggestScript';

const setSystemHost = promisify(set);
const getSystemHosts = promisify(get);

export const getAppHosts = (configuredSites = contextSites) =>
  configuredSites
    .filter((site) => site.host)
    .map((site) => site.host)
    .concat(hosts);

export const setupHosts = async () => {
  try {
    const appHosts = getAppHosts().filter((host) => host !== 'localhost');

    for (let i = 0; i < appHosts.length; i++) {
      const host = appHosts[i];

      await setSystemHost('127.0.0.1', host);
      console.log(`Successfully added '${bold(host)}' to your hosts file`);
    }
  } catch (e) {
    if (e.code === 'EACCES') {
      console.log(red('Error: setup-hosts must be run with root privileges'));
    } else {
      console.error(e);
    }

    throw e;
  }
};

const getMissingHosts = async () => {
  const systemHosts = await getSystemHosts(false);
  const appHosts = getAppHosts();

  return appHosts.filter(
    (appHost) => !systemHosts.find(([_, host]) => appHost === host),
  );
};

export const checkHosts = async () => {
  try {
    const missingHosts = await getMissingHosts();

    if (missingHosts.length > 0) {
      missingHosts.forEach((appHost) => {
        console.log(
          yellow(
            `Host '${bold(appHost)}' is not configured in your hosts file`,
          ),
        );
      });

      suggestScript('setup-hosts', { sudo: true });
    }
  } catch {
    // swallow error as this just a warning check
  }
};
