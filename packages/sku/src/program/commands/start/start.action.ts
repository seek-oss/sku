import type { StatsChoices } from '../../options/stats.option.js';
import type { SkuContext } from '../../../context/createSkuContext.js';
import type { Command } from 'commander';
import {
  configureProject,
  validatePeerDeps,
} from '../../../utils/configure.js';
import { watchVocabCompile } from '../../../services/vocab/runVocab.js';
import { checkHosts, withHostile } from '../../../context/hosts.js';
import { validatePolyfills } from '../../../utils/polyfillWarnings.js';
import chalk from 'chalk';
import { resolveEnvironment } from '../../../context/resolveEnvironment.js';

export const startAction = async (
  {
    stats,
    skuContext,
  }: {
    stats: StatsChoices;
    skuContext: SkuContext;
  },
  command: Command,
) => {
  console.log(chalk.blue(`sku start`));
  const { environment: environmentOption } = command.optsWithGlobals();

  const environment = resolveEnvironment({
    environment: environmentOption,
    skuContext,
  });

  await Promise.all([
    configureProject(skuContext),
    watchVocabCompile(skuContext),
  ]);

  withHostile(checkHosts)(skuContext);
  validatePeerDeps(skuContext);
  validatePolyfills(skuContext.polyfills);

  if (skuContext.bundler === 'vite') {
    const { viteStartHandler } = await import('./vite-start-handler.js');
    viteStartHandler({ skuContext, environment });
  } else {
    const { webpackStartHandler } = await import('./webpack-start-handler.js');
    webpackStartHandler({ stats, environment, skuContext });
  }
};
