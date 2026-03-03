import { getPathFromCwd, requireFromCwd } from '@sku-private/utils';
import { visualizer } from 'rollup-plugin-visualizer';
import type { PluginOption } from 'vite';

export const bundleAnalyzerPlugin = (): PluginOption => ({
  ...visualizer({
    filename: getPathFromCwd('report/client.html'),
    template: 'treemap',
    gzipSize: true,
    title: requireFromCwd('./package.json').name || 'Vite Bundle Analyzer',
  }),
  // make this plugin only apply to the client environment during build
  apply: 'build',
  applyToEnvironment: (environment) => environment.name === 'client',
});
