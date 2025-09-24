import { startVitest, parseCLI } from 'vitest/node';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import tsconfigPaths from 'vite-tsconfig-paths';

type SkuContext = {
  cjsInteropDependencies: string[];
  compilePackages: string[];
};

export const runVitest = async ({
  setupFiles = [],
  args,
  skuContext = { cjsInteropDependencies: [], compilePackages: [] },
}: {
  setupFiles: string | string[];
  args: string[];
  skuContext?: SkuContext;
}) => {
  const results = parseCLI(['vitest', ...args]);
  const { cjsInteropDependencies, compilePackages } = skuContext;

  const ctx = await startVitest(
    'test',
    results.filter,
    { config: false, ...results.options },
    {
      plugins: [vanillaExtractPlugin(), tsconfigPaths()],
      test: {
        environment: 'jsdom',
        setupFiles,
      },
      ssr: {
        noExternal: [...compilePackages, ...cjsInteropDependencies],
      },
    },
    {},
  );

  if (!ctx.shouldKeepServer()) {
    await ctx.exit();
  }
};
