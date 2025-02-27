import type { Command } from 'commander';

import { getSkuContext } from '@/context/createSkuContext.js';
import provider, { initializeTelemetry } from '@/services/telemetry/index.js';
import { experimentalBundlersHook } from '@/program/hooks/preAction/experimentalBundlersHook.js';

export const preActionHook = (rootCommand: Command, actionCommand: Command) => {
  const skuContext = getSkuContext({
    configPath: rootCommand.opts()?.config,
  });
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
