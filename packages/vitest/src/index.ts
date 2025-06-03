import { createVitest, parseCLI } from 'vitest/node';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

export const runVitest = async ({
  setupFiles = [],
  args,
}: {
  setupFiles: string | string[];
  args: string[];
}) => {
  const results = parseCLI(args);

  const vitest = await createVitest(
    'test',
    { config: false, ...results.options },
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

  await vitest.start(results.filter);

  process.exit(0);
};
