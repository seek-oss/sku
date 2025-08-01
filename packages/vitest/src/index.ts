import { startVitest, parseCLI } from 'vitest/node';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

export const runVitest = async ({
  setupFiles = [],
  args,
}: {
  setupFiles: string | string[];
  args: string[];
}) => {
  const results = parseCLI(['vitest', ...args]);

  await startVitest(
    'test',
    results.filter,
    { config: false, ...results.options },
    {
      plugins: [vanillaExtractPlugin()],
      test: {
        environment: 'jsdom',
        globals: true,
        setupFiles,
      },
    },
    {},
  );
};
