import { serverUrls } from '@sku-private/utils/src/serverUrls.js';
import type { PluginOption } from 'vite';
import { getAppHosts } from '../../../context/hosts.js';
import type { SkuContext } from '../../../context/createSkuContext.js';
import isCI from '../../../utils/isCI.js';
import { makePluginName } from '../helpers/makePluginName.js';

const shouldOpenTab = process.env.OPEN_TAB !== 'false' && !isCI;

export const devServerPlugin = ({
  skuContext,
}: {
  skuContext: SkuContext;
}): PluginOption => ({
  name: makePluginName('devServer'),
  config: () => ({
    server: {
      host: 'localhost',
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
