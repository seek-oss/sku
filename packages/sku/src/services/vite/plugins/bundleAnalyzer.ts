import { getPathFromCwd } from '../../../utils/cwd.js';
import { visualizer } from 'rollup-plugin-visualizer';
import type { Plugin } from 'vite';

export const bundleReportFolder = 'report';

export const bundleAnalyzerPlugin = ({ name }: { name: string }): Plugin =>
  visualizer({
    filename: getPathFromCwd(`${bundleReportFolder}/${name}.html`),
    template: 'treemap',
    open: false,
    gzipSize: true,
    brotliSize: false,
  });
