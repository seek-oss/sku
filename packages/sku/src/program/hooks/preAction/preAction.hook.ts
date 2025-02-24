import type { Command } from 'commander';

import { getSkuContext } from '@/context/createSkuContext.js';
import { initializeTelemetry } from '@/services/telemetry/index.js';
import { experimentalBundlersHook } from '@/program/hooks/preAction/experimentalBundlersHook.js';

export const preActionHook = (
  _thisCommand: Command,
  actionCommand: Command,
) => {
  const skuContext = getSkuContext({
    configPath: _thisCommand.opts()?.config,
  });
  initializeTelemetry(skuContext);
  actionCommand.setOptionValue('skuContext', skuContext);

  // TODO: remove once experimental bundlers are stable
  experimentalBundlersHook({
    command: actionCommand.name(),
    experimentalBundler: _thisCommand.opts()?.experimentalBundler,
    bundler: skuContext.bundler,
  });
};
