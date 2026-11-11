import { serverUrls } from '@sku-private/utils';
import type { PluginOption } from 'vite';
import { getAppHosts } from '../../../context/hosts.js';
import type { SkuContext } from '../../../context/createSkuContext.js';
import isCI from '../../../utils/isCI.js';
import { makePluginName } from '../helpers/makePluginName.js';

const shouldOpenTab = process.env.OPEN_TAB !== 'false' && !isCI;
const disableWatch = Boolean(process.env.SKU_VITE_DISABLE_WATCH);

export const devServerPlugin = ({
  skuContext,
}: {
  skuContext: SkuContext;
}): PluginOption => ({
  name: makePluginName('dev-server'),
  apply: 'serve',
  config: () => ({
    server: {
      watch: disableWatch
        ? null
        : {
            // In CI the pnpm store can sometimes live next to project files
            ignored: ['**/.pnpm-store/**'],
          },
      // Bind explicitly to IPv4 because IPv6 is not guaranteed to be enabled in CI
      host: isCI ? '127.0.0.1' : 'localhost',
      allowedHosts: getAppHosts(skuContext).filter(
        (host) => typeof host === 'string',
      ),
      open:
        shouldOpenTab &&
        serverUrls({
          hosts: getAppHosts(skuContext),
          port: skuContext.port.client,
          initialPath: skuContext.initialPath,
          https: skuContext.httpsDevServer,
        }).first(),
    },
  }),
});
