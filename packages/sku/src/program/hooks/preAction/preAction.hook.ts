import type { Command } from 'commander';

import { getSkuContext } from '../../../context/createSkuContext.js';
import provider, {
  initializeTelemetry,
} from '../../../services/telemetry/index.js';
import { experimentalBundlersHook } from './experimentalBundlersHook.js';

export const preActionHook = async (
  rootCommand: Command,
  actionCommand: Command,
) => {
  const { port, strictPort } = actionCommand.opts();
  const skuContext = await getSkuContext({
    configPath: rootCommand.opts()?.config,
    port,
    strictPort,
  });

  // Set extra options:
  skuContext.convertLoadable = actionCommand.opts()?.convertLoadable;
  skuContext.commandName = actionCommand.name();

  initializeTelemetry(skuContext);
  actionCommand.setOptionValue('skuContext', skuContext);

  // TODO: remove once experimental bundlers are stable
  experimentalBundlersHook({
    command: actionCommand.name(),
    experimentalBundler: rootCommand.opts()?.experimentalBundler,
    bundler: skuContext.bundler,
    isTelemetryInstalled: provider.isRealProvider,
  });
};
