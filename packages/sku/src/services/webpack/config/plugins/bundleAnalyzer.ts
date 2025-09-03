import { getPathFromCwd } from '@sku-lib/utils';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

export const bundleReportFolder = 'report';

export const bundleAnalyzerPlugin = ({
  name,
}: {
  // Name of the report file. E.g. `client` will result in `client.html`.
  name: string;
}) =>
  new BundleAnalyzerPlugin({
    analyzerMode: 'static',
    openAnalyzer: false,
    reportFilename: getPathFromCwd(`${bundleReportFolder}/${name}.html`),
  });
