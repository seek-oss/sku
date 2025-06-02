import { createVitest } from 'vitest/node';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

export const runVitest = async ({
  setupFiles,
  filters,
}: {
  setupFiles: string | string[];
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
        setupFiles,
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
