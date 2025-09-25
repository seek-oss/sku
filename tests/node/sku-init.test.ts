import { describe, expect, it } from 'vitest';

import { configure, scopeToFixture } from '@sku-private/testing-library';

const { sku } = scopeToFixture('sku-init');

const timeout = 5_000;
configure({
  asyncUtilTimeout: timeout,
});

describe('sku init', () => {
  it.each`
    description                  | args
    ${'without args'}            | ${[]}
    ${'with a project name'}     | ${['new-project']}
    ${'with an any option flag'} | ${['--packageManager=pnpm']}
  `(
    'should error if the user uses the init command $description',
    async ({ args }) => {
      const result = await sku('init', args);

      expect(
        await result.findByError(
          `'sku init' is deprecated. Please use '@sku-lib/create' instead.`,
        ),
      ).toBeInTheConsole();
    },
  );
});
