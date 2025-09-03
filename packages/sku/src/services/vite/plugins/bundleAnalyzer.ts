import { getPathFromCwd, requireFromCwd } from '@sku-lib/utils';
import { visualizer } from 'rollup-plugin-visualizer';
import type { Plugin } from 'vite';

export const bundleReportFolder = 'report';

const getProjectName = (): string => requireFromCwd('./package.json').name;

export const bundleAnalyzerPlugin = ({ name }: { name: string }): Plugin =>
  visualizer({
    filename: getPathFromCwd(`${bundleReportFolder}/${name}.html`),
    template: 'treemap',
    gzipSize: true,
    title: getProjectName() || 'Vite Bundle Analyzer',
  });
