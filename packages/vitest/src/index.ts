import { startVitest, parseCLI } from 'vitest/node';

export const runVitest = async ({
  setupFiles = [],
  args,
  noExternal,
  viteConfigOverride,
}: {
  setupFiles: string | string[];
  args: string[];
  noExternal?: string[];
  viteConfigOverride?: Record<string, any>;
}) => {
  const results = parseCLI(['vitest', ...args]);

  const ctx = await startVitest(
    'test',
    results.filter,
    {
      config: false,
      css: true,
      server: {
        deps: {
          // According to the docs all dependencies specified in ssr.noExternal will be inlined by default.
          // However this doesn't seem to be picked up properly. Adding these manually fixed transitive cjs interop.
          // @see https://vitest.dev/config/#server-deps-inline
          inline: noExternal,
        },
      },
      environment: 'jsdom',
      setupFiles,
      ...results.options,
    },
    viteConfigOverride,
    {},
  );

  if (!ctx.shouldKeepServer()) {
    await ctx.exit();
  }
};
