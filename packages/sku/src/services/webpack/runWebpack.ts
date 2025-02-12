import getStatsConfig from './config/statsConfig.js';
import type { Compiler, MultiCompiler } from 'webpack-dev-server';

export const run = async (
  compiler: Compiler | MultiCompiler,
  {
    stats: statsOption,
  }: {
    stats?: string;
  } = {},
): Promise<void> =>
  new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        reject(err);
      }

      console.log(
        stats?.toString(
          getStatsConfig({
            stats: statsOption,
          }),
        ),
      );

      if (stats?.hasErrors()) {
        reject('Sku build failed');
      }

      resolve();
    });
  });
