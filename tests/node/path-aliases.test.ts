import { describe, beforeAll, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import * as jsonc from 'jsonc-parser';

import { scopeToFixture, waitFor } from '@sku-private/testing-library';

const { sku, fixturePath } = scopeToFixture('path-aliases');

describe('pathAliases', () => {
  let tsconfig: any;

  describe('with Vite bundler', async () => {
    beforeAll(async () => {
      const tsconfigPath = fixturePath('tsconfig.json');
      const tsconfigContents = await readFile(tsconfigPath, 'utf-8');
      tsconfig = jsonc.parse(tsconfigContents);

      const configure = await sku('configure', ['--config=sku.config.vite.ts']);

      await waitFor(() => {
        expect(configure.hasExit()).toMatchObject({ exitCode: 0 });
      });
    });

    it('should generate TypeScript paths configuration with pathAliases', async () => {
      expect(tsconfig.compilerOptions.paths).toEqual({
        'src/*': ['./src/*'],
        '@components/*': ['./src/components/*'],
        '@utils/*': ['./src/utils/*'],
      });
    });

    it('should always include automatic src/* alias', async () => {
      expect(tsconfig.compilerOptions.paths).toMatchObject({
        'src/*': ['./src/*'],
      });
    });

    it('should preserve existing baseUrl behavior alongside paths', async () => {
      expect(tsconfig.compilerOptions.baseUrl).toBeDefined();
      expect(tsconfig.compilerOptions.paths).toBeDefined();
    });
  });

  describe('validation', () => {
    it('should reject pathAliases pointing to node_modules', async () => {
      const configure = await sku('configure', ['--config=sku.config.bad.ts']);

      await waitFor(() => {
        expect(configure.hasExit()).toMatchObject({ exitCode: 1 });
      });

      expect(
        configure.getByText(
          'Path alias "@bad/*" cannot point to node_modules.',
        ),
      ).toBeInTheConsole();
    });
  });
});
