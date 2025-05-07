import { describe, it } from 'vitest';
import fs from 'node:fs/promises';
import { runSkuCodemod } from '@sku-private/test-utils';
import dedent from 'dedent';
import { createFixture } from 'fs-fixture';

const filesToTest = [
  {
    filename: 'customNameFixture.tsx',
    input: dedent/* typescript */ `import customLoadable from 'sku/@loadable/component';

        const LoadableComponent = customLoadable(() => import('./MyComponent'));`,
    output: dedent/* typescript */ `import { loadable as customLoadable } from 'sku/vite/loadable';

        const LoadableComponent = customLoadable(() => import('./MyComponent'));`,
  },
  {
    filename: 'loadableNameFixture.tsx',
    input: dedent/* typescript */ `import loadable from 'sku/@loadable/component';

        const LoadableComponent = loadable(() => import('./MyComponent'));`,
    output: dedent/* typescript */ `import { loadable } from 'sku/vite/loadable';

        const LoadableComponent = loadable(() => import('./MyComponent'));`,
  },
  {
    filename: 'onlyNamedImportFixture.tsx',
    input: dedent/* typescript */ `import { loadableReady } from 'sku/@loadable/component';

        loadableReady();`,
    output: dedent/* typescript */ `import { loadableReady } from 'sku/@loadable/component';

        loadableReady();`,
  },
  {
    filename: 'mixedImportFixture.tsx',
    input: dedent/* typescript */ `import { loadableReady } from 'sku/@loadable/component';
        import loadable from 'sku/@loadable/component';

        loadable();

        loadableReady();`,
    output: dedent/* typescript */ `import { loadableReady } from 'sku/@loadable/component';
        import { loadable } from 'sku/vite/loadable';

        loadable();

        loadableReady();`,
  },
];

describe('sku codemods', () => {
  describe('"transform-vite-loadable" codemod', async () => {
    describe.for(filesToTest)(
      'File "$filename"',
      async ({ filename, input, output }) => {
        const fixture = await createFixture({
          [filename]: input,
        });

        it('"--dry" should not change any files', async ({ expect }) => {
          await runSkuCodemod('transform-vite-loadable', fixture.path, {
            args: ['.', '--dry'],
          });
          const fileContent = await fs.readFile(
            fixture.getPath(filename),
            'utf-8',
          );
          expect(fileContent).toEqual(input);
        });

        it('All output files should be the same', async ({ expect }) => {
          await runSkuCodemod('transform-vite-loadable', fixture.path, {
            args: ['.'],
          });
          const fileContent = await fs.readFile(
            fixture.getPath(filename),
            'utf-8',
          );
          expect(fileContent).toEqual(output);
        });
      },
    );
  });
});
