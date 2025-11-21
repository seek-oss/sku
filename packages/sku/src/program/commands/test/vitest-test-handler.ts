import type { SkuContext } from '../../../context/createSkuContext.js';
import type { InlineConfig } from 'vite';
import { createSkuVitestConfig } from '../../../services/vite/helpers/config/baseConfig.js';
import { parseCLI, type TestUserConfig, startVitest } from 'vitest/node';

export const vitestHandler = async ({
  skuContext,
  args,
}: {
  skuContext: SkuContext;
  args: string[];
}) => {
  const viteConfigOverride = createSkuVitestConfig(
    {},
    skuContext,
  ) satisfies InlineConfig;

  const results = parseCLI(['vitest', ...args]);

  const overrideableOptions: TestUserConfig =
    skuContext.skuConfig.dangerouslySetVitestConfig({
      css: true,
      environment: 'jsdom',
    });
  const nonOverrideableOptions: TestUserConfig = {
    // options passed in via the CLI will have priority over `dangerouslySetVitestConfig`
    ...results.options,
    setupFiles: skuContext.paths.setupTests,
    config: false,
  };

  const ctx = await startVitest(
    'test',
    results.filter,
    {
      ...overrideableOptions,
      ...nonOverrideableOptions,
    },
    viteConfigOverride,
  );

  if (!ctx.shouldKeepServer()) {
    await ctx.exit();
  }
};
