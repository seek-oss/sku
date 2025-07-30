import {
  describe,
  beforeAll,
  afterAll,
  it,
  expect as globalExpected,
} from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { dirContentsToObject } from '@sku-private/test-utils';
import {
  scopeToFixture,
  bundlers,
  cleanup,
  type BundlerValues,
} from '@sku-private/testing-library';

const { sku, fixturePath } = scopeToFixture('display-names-prod');

describe('display-names-prod', () => {
  describe.sequential.for(bundlers)('bundler: %s', (bundler) => {
    const args: BundlerValues<string[]> = {
      vite: ['--config', 'sku.config.vite.ts', '--experimental-bundler'],
      webpack: [],
    };

    describe('build', () => {
      beforeAll(async () => {
        const build = await sku('build', args[bundler]);
        globalExpected(
          await build.findByText('Sku build complete'),
        ).toBeInTheConsole();
      });

      it('should create build output', async ({ expect }) => {
        const distDir = fixturePath('dist');
        const files = await dirContentsToObject(distDir);
        expect(files).toMatchSnapshot();
      });

      it('should add displayName assignments to built JavaScript', async ({
        expect,
      }) => {
        const distDir = fixturePath('dist');
        const allFiles = readdirSync(distDir);

        const jsFiles = allFiles
          .filter((filename) => filename.endsWith('.js'))
          .map((filename) => ({
            filename,
            content: readFileSync(join(distDir, filename), 'utf-8'),
          }));

        expect(jsFiles.length).toBeGreaterThan(0);

        const hasDisplayNameAssignments = jsFiles.some(({ content }) =>
          /\.displayName\s*=\s*['"`][^'"`]+['"`]/.test(content),
        );

        expect(hasDisplayNameAssignments).toBe(true);

        const allJsContent = jsFiles.map(({ content }) => content).join('\n');
        expect(allJsContent).toMatch(/\w+\.displayName\s*=\s*['"`]Button['"`]/);
        expect(allJsContent).toMatch(/\w+\.displayName\s*=\s*['"`]Card['"`]/);
        expect(allJsContent).toMatch(/\w+\.displayName\s*=\s*['"`]Header['"`]/);
      });
    });
  });

  afterAll(cleanup);
});
