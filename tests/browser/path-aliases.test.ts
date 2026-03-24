import { describe, beforeAll, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import * as jsonc from 'jsonc-parser';

import {
  scopeToFixture,
  waitFor,
  hasExitSuccessfully,
} from '@sku-private/testing-library';
import { getPort } from '@sku-private/test-utils';
import { createPage } from '@sku-private/playwright';

const { sku, fixturePath } = scopeToFixture('path-aliases');

describe('pathAliases', () => {
  let tsconfig: any;

  describe('with Vite bundler', async () => {
    beforeAll(async () => {
      const configure = await sku('configure', ['--config=sku.config.vite.ts']);

      await hasExitSuccessfully(configure);

      const tsconfigPath = fixturePath('tsconfig.json');
      const tsconfigContents = await readFile(tsconfigPath, 'utf-8');
      tsconfig = jsonc.parse(tsconfigContents);
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

  describe.only('vite:start', () => {
    it('should resolve path aliases on start', async () => {
      const port = await getPort();

      const start = await sku('start', [
        '--config=sku.config.vite.ts',
        '--strict-port',
        `--port=${port}`,
      ]);

      expect(
        await start.findByText('Starting development server'),
      ).toBeInTheConsole();

      const appPage = await createPage();
      await appPage.goto(`http://localhost:${port}`);

      expect(
        start.queryByError('The plugin "vite-tsconfig-paths" is detected.'),
      ).not.toBeInTheConsole();

      expect(
        start.queryByError(
          "Cannot find module '@components/Button'",
          undefined,
        ),
      ).not.toBeInTheConsole();
    });
  });
});
