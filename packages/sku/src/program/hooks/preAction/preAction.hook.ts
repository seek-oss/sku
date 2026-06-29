import type { Command } from 'commander';

import { getSkuContext } from '../../../context/createSkuContext.js';
import { setGlobalTags } from '../../../services/telemetry/index.js';

export const preActionHook = (rootCommand: Command, actionCommand: Command) => {
  const { port, strictPort } = actionCommand.opts();
  const skuContext = getSkuContext({
    configPath: rootCommand.opts()?.config,
    port,
    strictPort,
  });

  // Set extra options:
  skuContext.convertLoadable = actionCommand.opts()?.convertLoadable;
  skuContext.listUrls = actionCommand.opts()?.listUrls;
  skuContext.commandName = actionCommand.name();

  setGlobalTags(skuContext);
  actionCommand.setOptionValue('skuContext', skuContext);
};
