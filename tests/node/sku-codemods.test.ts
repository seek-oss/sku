import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import dedent from 'dedent';
import { createFixture } from 'fs-fixture';
import { scopeToFixture } from '@sku-private/testing-library/codemod';

const filesToTest = [
  {
    filename: 'customNameFixture.tsx',
    input: dedent /* typescript */ `import customLoadable from "sku/@loadable/component";

        const LoadableComponent = customLoadable(() => import('./MyComponent'));`,
    output: dedent /* typescript */ `import { loadable as customLoadable } from '@sku-lib/vite/loadable';

        const LoadableComponent = customLoadable(() => import('./MyComponent'));`,
  },
  {
    filename: 'loadableNameFixture.tsx',
    input: dedent /* typescript */ `import loadable from 'sku/@loadable/component';

        const LoadableComponent = loadable(() => import('./MyComponent'));`,
    output: dedent /* typescript */ `import { loadable } from '@sku-lib/vite/loadable';

        const LoadableComponent = loadable(() => import('./MyComponent'));`,
  },
  {
    filename: 'onlyNamedImportFixture.tsx',
    input: dedent /* typescript */ `import { loadableReady } from 'sku/@loadable/component';

        loadableReady();`,
    output: dedent /* typescript */ `import { loadableReady } from 'sku/@loadable/component';

        loadableReady();`,
  },
  {
    filename: 'mixedImportFixture.tsx',
    input: dedent /* typescript */ `import { loadableReady } from 'sku/@loadable/component';
        import loadable from 'sku/@loadable/component';

        loadable();

        loadableReady();`,
    output: dedent /* typescript */ `import { loadableReady } from 'sku/@loadable/component';
        import { loadable } from '@sku-lib/vite/loadable';

        loadable();

        loadableReady();`,
  },
];

describe('sku codemods', () => {
  describe('"transform-vite-loadable" codemod', async () => {
    describe.for(filesToTest)(
      'File $filename',
      async ({ filename, input, output }) => {
        const fixture = await createFixture({
          [filename]: input,
        });

        const { codemod } = scopeToFixture(fixture.path);

        it('"--dry" should not change any files', async () => {
          const cli = await codemod('transform-vite-loadable', ['.', '--dry']);
          expect(
            await cli.findByText('files found that would be changed.'),
          ).toBeInTheConsole();

          const fileContent = await fs.readFile(
            fixture.getPath(filename),
            'utf-8',
          );
          expect(fileContent).toEqual(input);
        });

        it('Should transform files and match expected output', async () => {
          const cli = await codemod('transform-vite-loadable', ['.']);
          expect(await cli.findByText('Changed files')).toBeInTheConsole();

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
