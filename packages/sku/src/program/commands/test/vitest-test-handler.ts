import { createVitest } from 'vitest/node';
import type { SkuContext } from '@/context/createSkuContext.js';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

export const runVitest = async ({
  skuContext,
  filters,
}: {
  skuContext: SkuContext;
  filters: string[];
}) => {
  const vitest = await createVitest(
    'test',
    { config: false },
    {
      plugins: [vanillaExtractPlugin()],
      test: {
        watch: false,
        environment: 'jsdom',
        globals: true,
        setupFiles: skuContext.paths.setupTests,
        include: [
          '**/__tests__/**/*.test.{js,jsx,ts,tsx}',
          '**/?(*.)+(spec|test).{js,jsx,ts,tsx}',
        ],
      },
    },
    {},
  );

  await vitest.start(filters);

  process.exit(0);
};
