import { describe, expect, it } from 'vitest';

import { configure, scopeToFixture } from '@sku-private/testing-library';

const { sku } = scopeToFixture('sku-init');

const timeout = 5_000;
configure({
  asyncUtilTimeout: timeout,
});

describe('sku init', async () => {
  it('should error if the user uses the init command', async () => {
    const result = await sku('init');

    expect(
      await result.findByError(
        `'sku init' is deprecated. Please use '@sku-lib/create' instead.`,
      ),
    ).toBeInTheConsole();
  });

  it('should error if the user uses the init command with a project name', async () => {
    const result = await sku('init', ['new-project']);

    expect(
      await result.findByError(
        `'sku init' is deprecated. Please use '@sku-lib/create' instead.`,
      ),
    ).toBeInTheConsole();
  });

  it('should error if the user uses the init command with an unknown option', async () => {
    const result = await sku('init', ['--unknown']);

    expect(
      await result.findByError(
        `'sku init' is deprecated. Please use '@sku-lib/create' instead.`,
      ),
    ).toBeInTheConsole();
  });
});
