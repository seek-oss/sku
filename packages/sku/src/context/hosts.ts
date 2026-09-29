import { suggestScript } from '../utils/suggestScript.js';
import { hasErrorCode } from '../utils/error-guards.js';
import type { SkuContext } from './createSkuContext.js';
import { isIP } from 'node:net';
import { addSystemHost, readSystemHosts, type HostEntry } from './hostsFile.js';
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

const warnConflictingHosts = (
  systemHosts: HostEntry[],
  ip: string,
  host: string,
) => {
  const conflict = systemHosts.find(
    ([entryIp, entryHost]) =>
      entryHost === host && entryIp !== ip && isIP(entryIp) === isIP(ip),
  );

  if (conflict) {
    console.log(
      caution(
        `Host '${strong(host)}' is already mapped to '${conflict[0]}' in your hosts file. Remove that entry if '${host}' should resolve to '${ip}'.`,
      ),
    );
  }
};

export const setupHosts = async (skuContext: SkuContext): Promise<void> => {
  try {
    const appHosts = getAppHosts(skuContext).filter(
      (host) => host !== 'localhost',
    );
    const systemHosts = await readSystemHosts();

    for (const host of appHosts) {
      if (!host) {
        continue;
      }

      for (const ip of ['127.0.0.1', '::1']) {
        warnConflictingHosts(systemHosts, ip, host);
        await addSystemHost(ip, host);
      }
      console.log(`Successfully added '${strong(host)}' to your hosts file`);
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
  const systemHosts = await readSystemHosts();
  const missingHosts = getAppHosts(skuContext).filter(
    (appHost) =>
      !isLocalhostHost(appHost) &&
      !systemHosts.find(([_, host]) => appHost === host),
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
