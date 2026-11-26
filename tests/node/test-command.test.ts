import { describe, it, expect } from 'vitest';

import { scopeToFixture } from '@sku-private/testing-library';

const { sku } = scopeToFixture('sku-test');

describe('sku-test', () => {
  it('should run tests', async () => {
    const process = await sku('test', ['run', 'src/vitest.test.ts']);

    await expect(process).toMatchExitCode(0);
  });

  it('should run setupTests', async () => {
    const process = await sku('test', [
      'run',
      'src/vitest.test.ts',
      '--silent=false',
    ]);

    expect(await process.findByText(/running setup test/i)).toBeInTheConsole();
    await expect(process).toMatchExitCode(0);
  });

  it(`should pass through unknown flags`, async () => {
    const process = await sku('test', [
      'testfile.ts',
      '--passWithNoTests',
      'run',
    ]);

    expect(
      await process.findByText('No test files found, exiting with code 0'),
    ).toBeInTheConsole();
  });

  // TODO: Add tests that interact with watch mode
});

describe('vitest CJS interop', () => {
  it('should run tests that import modules that require CJS interop', async () => {
    const process = await sku('test', ['cjsInterop.test.ts', '--run']);

    await expect(process).toMatchExitCode(0);
  });
});
