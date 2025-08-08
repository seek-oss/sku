import { describe, beforeAll, it, expect as globalExpect } from 'vitest';
import { readFile } from 'node:fs/promises';
import * as jsonc from 'jsonc-parser';

import { scopeToFixture, waitFor } from '@sku-private/testing-library';

const { sku, fixturePath } = scopeToFixture('path-aliases');

describe('pathAliases', () => {
  describe('with Vite bundler', () => {
    beforeAll(async () => {
      const configure = await sku('configure', ['--config=sku.config.vite.ts']);

      await waitFor(() => {
        globalExpect(configure.hasExit()).toMatchObject({ exitCode: 0 });
      });
    });

    it('should generate TypeScript paths configuration with pathAliases', async ({
      expect,
    }) => {
      const tsconfigPath = fixturePath('tsconfig.json');
      const tsconfigContents = await readFile(tsconfigPath, 'utf-8');
      const tsconfig = jsonc.parse(tsconfigContents);

      expect(tsconfig.compilerOptions.paths).toEqual({
        'src/*': ['./src/*'],
        '@components/*': ['./src/components/*'],
        '@utils/*': ['./src/utils/*'],
      });
    });

    it('should always include automatic src/* alias', async ({ expect }) => {
      const tsconfigPath = fixturePath('tsconfig.json');
      const tsconfigContents = await readFile(tsconfigPath, 'utf-8');
      const tsconfig = jsonc.parse(tsconfigContents);

      expect(tsconfig.compilerOptions.paths).toMatchObject({
        'src/*': ['./src/*'],
      });
    });

    it('should preserve existing baseUrl behavior alongside paths', async ({
      expect,
    }) => {
      const tsconfigPath = fixturePath('tsconfig.json');
      const tsconfigContents = await readFile(tsconfigPath, 'utf-8');
      const tsconfig = jsonc.parse(tsconfigContents);

      expect(tsconfig.compilerOptions.baseUrl).toBeDefined();
      expect(tsconfig.compilerOptions.paths).toBeDefined();
    });
  });

  describe('validation', () => {
    it('should reject pathAliases pointing to node_modules', async ({
      expect,
    }) => {
      const configure = await sku('configure', ['--config=sku.config.bad.ts']);

      await waitFor(() => {
        expect(configure.hasExit()).toMatchObject({ exitCode: 1 });
      });

      expect(configure.getStdallStr()).toContain(
        'Path alias "@bad/*" cannot point to node_modules.',
      );
    });
  });
});
