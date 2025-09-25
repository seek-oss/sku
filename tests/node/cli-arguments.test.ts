import { describe, expect, it } from 'vitest';

import { scopeToFixture } from '@sku-private/testing-library';

const { sku } = scopeToFixture('cli-arguments');

describe('cli-arguments', () => {
  it('should throw an error when an unknown option is provided', async () => {
    const process = await sku('build', ['--foo']);

    expect(
      await process.findByError("error: unknown option '--foo'"),
    ).toBeInTheConsole();
  });

  it('should throw an error if excess arguments are provided', async () => {
    const process = await sku('build', ['extra', 'arg', 'provided']);

    expect(
      await process.findByError(
        "error: too many arguments for 'build'. Expected 0 arguments but got 3.",
      ),
    ).toBeInTheConsole();
  });
});
