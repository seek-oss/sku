import { describe, it, expect } from 'vitest';

import {
  testFrameworks,
  type TestFrameworkValues,
  scopeToFixture,
  waitFor,
} from '@sku-private/testing-library';

const { sku } = scopeToFixture('sku-test');

describe.for(testFrameworks)('[%s]: sku-test', (testRunner) => {
  it('should run tests', async () => {
    const args: TestFrameworkValues<string[]> = {
      // Vitest needs the `run` argument as it defaults to watch mode
      vitest: ['--config=sku.config.vitest.ts', 'run', 'src/vitest.test.ts'],
      jest: ['src/jest.test.ts'],
    };

    const process = await sku('test', args[testRunner]);

    expect(await process.findByText(/running setup test/i)).toBeInTheConsole();
    await waitFor(() => {
      expect(process.hasExit()).toMatchObject({ exitCode: 0 });
    });
  });

  it(`should pass through unknown flags`, async () => {
    const args: TestFrameworkValues<string[]> = {
      // Vitest needs the `run` argument as it defaults to watch mode
      vitest: ['--config=sku.config.vitest.ts', 'run'],
      jest: [],
    };

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

  // TODO: Add tests that interact with watch mode
});

describe('vitest CJS interop', () => {
  it('should run tests that import modules that require CJS interop', async () => {
    const process = await sku('test', [
      '--config=sku.config.vitest.ts',
      'cjsInterop.test.ts',
      '--run',
    ]);

    expect(await process.findByText(/running setup test/i)).toBeInTheConsole();
    await waitFor(() => {
      expect(process.hasExit()).toMatchObject({ exitCode: 0 });
    });
  });
});
