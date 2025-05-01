import { describe, it } from 'vitest';
import fs from 'node:fs/promises';
import { runSkuCodemod } from '@sku-private/test-utils';
import dedent from 'dedent';
import { createFixture } from 'fs-fixture';

describe('sku codemods', () => {
  describe('"transform-vite-loadable" codemod', async () => {
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
    ];

    const fixture = await createFixture(
      filesToTest.reduce((acc: Record<string, string>, { filename, input }) => {
        acc[filename] = input;
        return acc;
      }, {}),
    );

    it('"--dry" should not change any files', async ({ expect }) => {
      await runSkuCodemod('transform-vite-loadable', fixture.path, [
        '.',
        '--dry',
      ]);
      filesToTest.forEach(async ({ filename, input }) => {
        const fileContent = await fs.readFile(
          fixture.getPath(filename),
          'utf-8',
        );
        expect(fileContent).toEqual(input);
      });
    });

    it('"--dry --print" should not change any files and print the changes to stdout', async ({
      expect,
    }) => {
      const { stdout } = await runSkuCodemod(
        'transform-vite-loadable',
        fixture.path,
        ['.', '-dp'],
      );
      // Replace fixture.path with cwd to stop snapshot problems when running in different environments.
      const trimmedString = stdout.replaceAll(fixture.path, '/$cwd/');
      expect(trimmedString).toMatchSnapshot();
    });

    it('All output files should be the same', async ({ expect }) => {
      await runSkuCodemod('transform-vite-loadable', fixture.path, ['.']);
      filesToTest.forEach(async ({ filename, output }) => {
        const fileContent = await fs.readFile(
          fixture.getPath(filename),
          'utf-8',
        );
        expect(fileContent).toEqual(output);
      });
    });
  });
});
