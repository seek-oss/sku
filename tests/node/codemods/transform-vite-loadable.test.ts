import ts from 'dedent';
import { runCodemodTests } from '@sku-private/testing-library/codemod';

runCodemodTests('transform-vite-loadable', [
  {
    filename: 'customNameFixture.tsx',
    input: ts /* ts */ `
      import customLoadable from "sku/@loadable/component";

      const LoadableComponent = customLoadable(() => import('./MyComponent'));`,
    output: ts /* ts */ `
      import { loadable as customLoadable } from '@sku-lib/vite/loadable';

      const LoadableComponent = customLoadable(() => import('./MyComponent'));`,
  },
  {
    filename: 'loadableNameFixture.tsx',
    input: ts /* ts */ `
      import loadable from 'sku/@loadable/component';

      const LoadableComponent = loadable(() => import('./MyComponent'));`,
    output: ts /* ts */ `
      import { loadable } from '@sku-lib/vite/loadable';

      const LoadableComponent = loadable(() => import('./MyComponent'));`,
  },
  {
    filename: 'onlyNamedImportFixture.tsx',
    input: ts /* ts */ `
      import { loadableReady } from 'sku/@loadable/component';

      loadableReady();`,
    output: ts /* ts */ `
      import { loadableReady } from 'sku/@loadable/component';

      loadableReady();`,
  },
  {
    filename: 'mixedImportFixture.tsx',
    input: ts /* ts */ `
      import { loadableReady } from 'sku/@loadable/component';
      import loadable from 'sku/@loadable/component';

      loadable();

      loadableReady();`,
    output: ts /* ts */ `
      import { loadableReady } from 'sku/@loadable/component';
      import { loadable } from '@sku-lib/vite/loadable';

      loadable();

      loadableReady();`,
  },
]);
