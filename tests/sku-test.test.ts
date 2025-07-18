import { describe, it, afterEach } from 'vitest';

import { scopeToFixture, waitFor, cleanup } from '@sku-private/testing-library';

const { render } = scopeToFixture('sku-test');

const testRunners = ['vitest', 'jest'] as const;

afterEach(async () => {
  await cleanup();
});

describe.for(testRunners)('[%s]: sku-test', (testRunner) => {
  const args: Record<(typeof testRunners)[number], string[]> = {
    vitest: ['--config=sku.config.vitest.ts'],
    jest: [],
  };

  it('should run tests', async ({ expect }) => {
    const process = await render('test', args[testRunner]);

    expect(await process.findByText(/running setup test/i)).toBeInTheConsole();
    await waitFor(() => {
      expect(process.hasExit()).toMatchObject({ exitCode: 0 });
    });
  });

  it(`should pass through unknown flags`, async ({ expect }) => {
    const process = await render('test', [
      'testfile.ts',
      '--passWithNoTests',
      ...args[testRunner],
    ]);

    const expected: Record<(typeof testRunners)[number], string> = {
      vitest: 'No test files found, exiting with code 0',
      jest: 'No tests found, exiting with code 0',
    };

    expect(await process.findByText(expected[testRunner])).toBeInTheConsole();
  });
});
