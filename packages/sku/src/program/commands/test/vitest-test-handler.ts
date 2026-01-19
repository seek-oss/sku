import type { SkuContext } from '../../../context/createSkuContext.js';
import type { InlineConfig } from 'vite';
import { createSkuVitestConfig } from '../../../services/vite/helpers/config/baseConfig.js';
import type { TestUserConfig } from 'vitest/node';
import { hasErrorCode } from '../../../utils/error-guards.js';
import { styleText } from 'node:util';

export const vitestHandler = async ({
  skuContext,
  args,
}: {
  skuContext: SkuContext;
  args: string[];
}) => {
  const { parseCLI, startVitest } = await lazyLoadVitest();

  const viteConfigOverride = createSkuVitestConfig(
    {},
    skuContext,
  ) satisfies InlineConfig;

  const results = parseCLI(['vitest', ...args]);

  const overrideableOptions: TestUserConfig = skuContext.vitestDecorator({
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

const lazyLoadVitest = async () => {
  try {
    const vitest = await import('vitest/node');
    return vitest;
  } catch (error: any) {
    if (hasErrorCode(error) && error.code === 'ERR_MODULE_NOT_FOUND') {
      const vitest = styleText('bold', 'vitest');
      console.error(
        styleText(
          'red',
          `Could not find ${vitest}. Please install it in your project's devDependencies.`,
        ),
      );
      process.exit(1);
    }
    throw error;
  }
};
