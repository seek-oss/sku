import { startVitest, parseCLI, type TestUserConfig } from 'vitest/node';

export const runVitest = async ({
  setupFiles = [],
  args,
  vitestConfigOverride,
  viteConfigOverride,
}: {
  setupFiles: string | string[];
  args: string[];
  vitestConfigOverride?: TestUserConfig;
  viteConfigOverride?: Record<string, any>;
}) => {
  const results = parseCLI(['vitest', ...args]);

  const ctx = await startVitest(
    'test',
    results.filter,
    {
      css: true,
      environment: 'jsdom',
      ...vitestConfigOverride,
      ...results.options,
      setupFiles,
      config: false,
    },
    viteConfigOverride,
  );

  if (!ctx.shouldKeepServer()) {
    await ctx.exit();
  }
};
