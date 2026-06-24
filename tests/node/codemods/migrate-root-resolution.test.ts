import dedent from 'dedent';
import { runCodemodTests } from '@sku-private/testing-library/codemod';

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

      export default {
        pathAliases: {
          '#src/*': './src/*',
        },
        clientEntry: 'src/client.tsx',
      } satisfies SkuConfig;
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
        pathAliases: {
          '#src/*': './src/*',
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
      const config = {
        pathAliases: {
          '#src/*': './src/*',
        },
        clientEntry: 'src/client.tsx',
      };

      export default config;
    `,
  },
  // Handles CommonJS (`module.exports`) configs
  {
    filename: 'sku.config.js',
    input: dedent /* js */ `
      module.exports = {
        clientEntry: 'src/client.tsx',
      };
    `,
    output: dedent /* js */ `
      module.exports = {
        pathAliases: {
          '#src/*': './src/*',
        },
        clientEntry: 'src/client.tsx',
      };
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
