import dedent from 'dedent';
import {
  runCodemodTests,
  scopeToFixture,
} from '@sku-private/testing-library/codemod';
import { createFixture, waitFor } from '@sku-private/testing-library';
import { it, expect } from 'vitest';

runCodemodTests('migrate-root-resolution', [
  {
    filename: 'imports.tsx',
    input: dedent /* tsx */ `
      import { add } from 'src/utils/add';
      import Thing from 'src/components/Thing';
      import 'src/styles/reset.css';
      export { foo } from 'src/lib/foo';
      const lazy = import('src/lazy');
      const cjs = require('src/cjs');
      import local from './src/local';
      import external from 'pkg/src/thing';
      vi.mock('src/mocked');
      const { mocked } = (await vi.importActual(
        'src/mocked',
      )) as { mocked: Mocked };
    `,
    output: dedent /* tsx */ `
      import { add } from '#src/utils/add';
      import Thing from '#src/components/Thing';
      import '#src/styles/reset.css';
      export { foo } from '#src/lib/foo';
      const lazy = import('#src/lazy');
      const cjs = require('#src/cjs');
      import local from './src/local';
      import external from 'pkg/src/thing';
      vi.mock('#src/mocked');
      const { mocked } = (await vi.importActual(
        '#src/mocked',
      )) as { mocked: Mocked };
    `,
  },
  // Adds a `pathAliases` entry to the sku config
  {
    filename: 'sku.config.ts',
    input: dedent /* ts */ `
      import type { SkuConfig } from 'sku';

      export default {
        clientEntry: 'src/client.tsx',
      } satisfies SkuConfig;
    `,
    output: dedent /* ts */ `
      import type { SkuConfig } from 'sku';

      export default { pathAliases: { '#src/*': './src/*' },
        clientEntry: 'src/client.tsx',
      } satisfies SkuConfig;
    `,
  },
  // Adds a `pathAliases` entry to the sku config (literal default export)
  {
    filename: 'sku.config.ts',
    input: dedent /* ts */ `
      import type { SkuConfig } from 'sku';

      const config: SkuConfig = {
        clientEntry: 'src/client.tsx',
      };
      export default config;
    `,
    output: dedent /* ts */ `
      import type { SkuConfig } from 'sku';

      const config: SkuConfig = { pathAliases: { '#src/*': './src/*' },
        clientEntry: 'src/client.tsx',
      };
      export default config;
    `,
  },
  // Merges into an existing `pathAliases` object
  {
    filename: 'sku.config.ts',
    input: dedent /* ts */ `
      export default {
        pathAliases: {
          '#utils/*': './src/utils/*',
        },
      } satisfies SkuConfig;
    `,
    output: dedent /* ts */ `
      export default {
        pathAliases: { '#src/*': './src/*',
          '#utils/*': './src/utils/*',
        },
      } satisfies SkuConfig;
    `,
  },
  // Resolves a non-literal default export (`export default config`)
  {
    filename: 'sku.config.ts',
    input: dedent /* ts */ `
      const config = {
        clientEntry: 'src/client.tsx',
      };

      export default config;
    `,
    output: dedent /* ts */ `
      const config = { pathAliases: { '#src/*': './src/*' },
        clientEntry: 'src/client.tsx',
      };

      export default config;
    `,
  },
  // Leaves the config untouched when `#src/*` is already present
  {
    filename: 'sku.config.ts',
    input: dedent /* ts */ `
      export default {
        pathAliases: {
          '#src/*': './src/*',
        },
      };
    `,
    output: dedent /* ts */ `
      export default {
        pathAliases: {
          '#src/*': './src/*',
        },
      };
    `,
  },
]);

it('should fail on unsupported file', async () => {
  const fixture = await createFixture({
    'sku.config.js': dedent /* js */ `
    module.exports = {
      clientEntry: 'src/client.tsx',
    };
  `,
  });
  const { codemod } = scopeToFixture(fixture.path);

  const cli = await codemod('migrate-root-resolution', ['.']);

  await waitFor(() => {
    expect(cli.hasExit()).toMatchObject({ exitCode: 1 });
  });

  expect(
    await cli.findByError('Unsupported sku config shape:'),
  ).toBeInTheConsole();
});
