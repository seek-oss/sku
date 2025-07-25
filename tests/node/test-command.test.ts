import { describe, it, afterEach } from 'vitest';

import {
  testFrameworks,
  type TestFrameworkValues,
  scopeToFixture,
  waitFor,
} from '@sku-private/testing-library';

const { sku } = scopeToFixture('sku-test');

describe.for(testFrameworks)('[%s]: sku-test', (testRunner) => {
  const args: TestFrameworkValues<string[]> = {
    vitest: ['--config=sku.config.vitest.ts'],
    jest: [],
  };

  it('should run tests', async ({ expect }) => {
    const process = await sku('test', args[testRunner]);

    expect(await process.findByText(/running setup test/i)).toBeInTheConsole();
    await waitFor(() => {
      expect(process.hasExit()).toMatchObject({ exitCode: 0 });
    });
  });

  it(`should pass through unknown flags`, async ({ expect }) => {
    const process = await sku('test', [
      'testfile.ts',
      '--passWithNoTests',
      ...args[testRunner],
    ]);

    const expected: TestFrameworkValues<string> = {
      vitest: 'No test files found, exiting with code 0',
      jest: 'No tests found, exiting with code 0',
    };

    expect(await process.findByText(expected[testRunner])).toBeInTheConsole();
  });
});
