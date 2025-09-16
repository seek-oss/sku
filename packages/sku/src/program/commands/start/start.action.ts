import type { StatsChoices } from '../../options/stats/stats.option.js';
import type { SkuContext } from '../../../context/createSkuContext.js';
import type { Command } from 'commander';
import {
  configureProject,
  validatePeerDeps,
} from '../../../utils/configure.js';
import { watchVocabCompile } from '../../../services/vocab/runVocab.js';
import { checkHosts, withHostile } from '../../../context/hosts.js';
import { detectUnnecessaryPolyfills } from '../../../utils/polyfillDetector.js';
import { displayPolyfillWarnings } from '../../../utils/polyfillWarnings.js';
import chalk from 'chalk';

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
  const { environment } = command.optsWithGlobals();

  console.log(chalk.blue(`sku start`));

  await Promise.all([
    configureProject(skuContext),
    watchVocabCompile(skuContext),
  ]);

  withHostile(checkHosts)(skuContext);
  validatePeerDeps(skuContext);

  // Check for unnecessary polyfills and display warnings
  const detectedPolyfills = detectUnnecessaryPolyfills(skuContext.polyfills);
  displayPolyfillWarnings(detectedPolyfills);

  if (skuContext.bundler === 'vite') {
    const { viteStartHandler } = await import('./vite-start-handler.js');
    viteStartHandler(skuContext);
  } else {
    const { webpackStartHandler } = await import('./webpack-start-handler.js');
    webpackStartHandler({ stats, environment, skuContext });
  }
};
