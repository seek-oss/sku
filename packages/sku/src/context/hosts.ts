import { suggestScript } from '../utils/suggestScript.js';
import { hasErrorCode } from '../utils/error-guards.js';
import type { SkuContext } from './createSkuContext.js';
import { isIP } from 'node:net';
import {
  addSystemHosts,
  readSystemHosts,
  type HostEntry,
} from './hostsFile.js';
import { caution, critical, strong } from '@sku-private/utils/console';

const isLocalhostHost = (host: string) => {
  const normalised = host.toLowerCase();
  return normalised === 'localhost' || normalised.endsWith('.localhost');
};

export const getAppHosts = ({ sites: configuredSites, hosts }: SkuContext) =>
  configuredSites
    .reduce<string[]>((acc, currSite) => {
      if (currSite.host) {
        return [...acc, currSite.host];
      }
      return acc;
    }, [])
    .concat(hosts);

const LOOPBACK_IPS = ['127.0.0.1', '::1'];

const warnIfAlreadyMapped = (
  systemHosts: HostEntry[],
  [ip, host]: HostEntry,
) => {
  const conflict = systemHosts.find(
    ([entryIp, entryHost]) =>
      entryHost === host && entryIp !== ip && isIP(entryIp) === isIP(ip),
  );

  if (conflict) {
    console.log(
      caution(
        `Your hosts file already maps '${strong(host)}' to '${conflict[0]}'. To make '${host}' resolve to '${ip}', remove that entry.`,
      ),
    );
  }
};

export const setupHosts = async (skuContext: SkuContext): Promise<void> => {
  const appHosts = [
    ...new Set(
      getAppHosts(skuContext).filter((host) => host && host !== 'localhost'),
    ),
  ];
  if (appHosts.length === 0) {
    return;
  }

  const entries = appHosts.flatMap((host) =>
    LOOPBACK_IPS.map((ip): HostEntry => [ip, host]),
  );

  try {
    const systemHosts = await readSystemHosts();
    for (const entry of entries) {
      warnIfAlreadyMapped(systemHosts, entry);
    }

    const addedLines = await addSystemHosts(entries);

    if (addedLines.length === 0) {
      console.log('Your hosts file already contains all app hosts');
    }
    for (const line of addedLines) {
      console.log(`Added '${strong(line)}' to your hosts file`);
    }
  } catch (e: unknown) {
    if (hasErrorCode(e) && e.code === 'EACCES') {
      console.log(
        critical('Error: setup-hosts must be run with root privileges'),
      );
    } else {
      console.error(e);
    }

    throw e;
  }
};

export const checkHosts = async (skuContext: SkuContext): Promise<void> => {
  const systemHostNames = new Set(
    (await readSystemHosts()).map(([_, host]) => host),
  );
  const missingHosts = getAppHosts(skuContext).filter(
    (appHost) => !isLocalhostHost(appHost) && !systemHostNames.has(appHost),
  );

  try {
    if (missingHosts.length > 0) {
      missingHosts.forEach((appHost) => {
        console.log(
          caution(
            `Host '${strong(appHost)}' is not configured in your hosts file`,
          ),
        );
      });

      suggestScript('setup-hosts', { sudo: true });
    }
  } catch {
    // swallow error as this just a warning check
  }
};
