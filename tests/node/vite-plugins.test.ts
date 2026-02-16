import { describe, it, expect } from 'vitest';

import { scopeToFixture, waitFor } from '@sku-private/testing-library';

const { sku } = scopeToFixture('vite-plugins');

describe('__UNSTABLE_vitePlugins', () => {
  it('should run custom Vite plugins during build', async () => {
    const build = await sku('build');

    await waitFor(() => {
      expect(build.hasExit()).toMatchObject({ exitCode: 0 });
    });

    expect(
      await build.findByText('build started with vite plugin'),
    ).toBeInTheConsole();
  });

  it('should run custom Vite plugins during start', async () => {
    const start = await sku('start');

    expect(
      await start.findByText('configureServer with vite plugin'),
    ).toBeInTheConsole();
  });
});
