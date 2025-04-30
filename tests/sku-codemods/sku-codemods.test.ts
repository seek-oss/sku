import { describe, beforeAll, afterAll, it } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import { runSkuCodemod } from '@sku-private/test-utils';
import dedent from 'dedent';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const fixtureDirectory = __dirname;
const projectName = 'codemod-project';
const projectDirectory = path.join(fixtureDirectory, projectName);

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

    beforeAll(async () => {
      await fs.rm(projectDirectory, { recursive: true, force: true });

      await fs.rm(path.join(fixtureDirectory, projectName), {
        recursive: true,
        force: true,
      });

      await fs.mkdir(projectDirectory, { recursive: true });

      filesToTest.forEach(async ({ filename, input }) => {
        const filePath = path.join(projectDirectory, filename);
        await fs.writeFile(filePath, input);
      });
    });

    afterAll(async () => {
      await fs.rm(projectDirectory, { recursive: true, force: true });
    });

    it('All output files should be the same', async ({ expect }) => {
      await runSkuCodemod('transform-vite-loadable', projectDirectory, ['.']);

      filesToTest.forEach(async ({ filename, output }) => {
        const filePath = path.join(projectDirectory, filename);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        expect(fileContent).toEqual(output);
      });
    });
  });
});
