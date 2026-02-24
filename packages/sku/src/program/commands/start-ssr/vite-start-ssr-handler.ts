import chalk from 'chalk';
import { viteService } from '../../../services/vite/index.js';
import type { StatsChoices } from '../../options/stats.option.js';
import type { SkuContext } from '../../../context/createSkuContext.js';

export const viteStartSsrHandler = async ({
  stats: _stats,
  skuContext,
}: {
  stats: StatsChoices;
  skuContext: SkuContext;
}) => {
  process.env.NODE_ENV = 'development';

  console.log();
  console.log(
    chalk.blue(
      `Starting the Vite dev server for SSR on port ${skuContext.port.client}`,
    ),
  );
  console.log('Starting development server...');
  console.log();

  await viteService.startSsr(skuContext);
};
