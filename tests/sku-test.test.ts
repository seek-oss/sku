import { describe, it } from 'vitest';
import path from 'node:path';
import { createRequire } from 'node:module';
import { render, configure, waitFor } from 'cli-testing-library';

configure({
  asyncUtilTimeout: 3000,
  renderAwaitTime: 1000,
});

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/sku-test/sku.config.ts'),
);

const testRunners = ['vitest', 'jest'] as const;

describe.for(testRunners)('[%s]: sku-test', (testRunner) => {
  const args: Record<(typeof testRunners)[number], string[]> = {
    vitest: ['--config=sku.config.vitest.ts'],
    jest: [],
  };

  it('should run tests', async ({ expect }) => {
    const process = await render(
      'node_modules/.bin/sku',
      ['test', ...args[testRunner]],
      {
        cwd: appDir,
      },
    );

    expect(await process.findByText(/running setup test/i)).toBeInTheConsole();
    await waitFor(() => {
      expect(process.hasExit()).toMatchObject({ exitCode: 0 });
    });
  });

  it(`should pass through unknown flags to vite`, async ({ expect }) => {
    const process = await render(
      'node_modules/.bin/sku',
      ['test', 'testfile.ts', '--passWithNoTests', ...args[testRunner]],
      {
        cwd: appDir,
      },
    );

    const expected: Record<(typeof testRunners)[number], string> = {
      vitest: 'No test files found, exiting with code 0',
      jest: 'No tests found, exiting with code 0',
    };

    expect(await process.findByText(expected[testRunner])).toBeInTheConsole();
  });
});
