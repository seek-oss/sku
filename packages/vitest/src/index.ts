import { startVitest, parseCLI } from 'vitest/node';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import tsconfigPaths from 'vite-tsconfig-paths';
import { cjsInterop } from 'vite-plugin-cjs-interop';

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

  await startVitest(
    'test',
    results.filter,
    { config: false, ...results.options },
    {
      plugins: [
        vanillaExtractPlugin(),
        tsconfigPaths(),
        cjsInterop({
          dependencies: [...cjsInteropDependencies],
        }),
      ],
      test: {
        environment: 'jsdom',
        globals: true,
        setupFiles,
      },
      ssr: {
        noExternal: [...compilePackages],
      },
    },
    {},
  );
};
