import type { StatsChoices } from '../../options/stats.option.js';
import type { SkuContext } from '../../../context/createSkuContext.js';
import { validatePolyfills } from '../../../utils/polyfillWarnings.js';
import {
  configureProject,
  validatePeerDeps,
} from '../../../utils/configure.js';
import { watchVocabCompile } from '../../../services/vocab/runVocab.js';
import { checkHosts, withHostile } from '../../../context/hosts.js';

export const startSsrAction = async ({
  stats,
  skuContext,
}: {
  stats: StatsChoices;
  skuContext: SkuContext;
}) => {
  await configureProject(skuContext);
  validatePeerDeps(skuContext);
  validatePolyfills(skuContext.polyfills);
  await watchVocabCompile(skuContext);

  withHostile(checkHosts)(skuContext);

  if (skuContext.bundler === 'vite') {
    const { viteStartSsrHandler } = await import('./vite-start-ssr-handler.js');
    await viteStartSsrHandler({ stats, skuContext });
  } else {
    const { webpackStartSsrHandler } = await import(
      './webpack-start-ssr-handler.js'
    );
    webpackStartSsrHandler({ stats, skuContext });
  }
};
