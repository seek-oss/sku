import { describe, it, expect } from 'vitest';

import {
  bundlers,
  type BundlerValues,
  scopeToFixture,
} from '@sku-private/testing-library';
import { getPort } from '@sku-private/test-utils';
import { createPage } from '@sku-private/playwright';

const { sku, node } = scopeToFixture('assertion-removal');

describe('assertion-removal', () => {
  describe.for(bundlers)('bundler %s', (bundler) => {
    describe('build', async () => {
      const args: BundlerValues<string[]> = {
        vite: [],
        webpack: ['--config', 'sku.config.webpack.ts'],
      };

      it('should not contain "assert" or "invariant" in production', async () => {
        const port = await getPort();
        const url = `http://localhost:${port}`;

        const build = await sku('build', args[bundler]);
        await expect(build).toMatchExitCode(0);

        const serve = await sku('serve', ['--strict-port', `--port=${port}`]);
        expect(await serve.findByText('Server started')).toBeInTheConsole();

        const appPage = await createPage();
        const response = await appPage.goto(url);
        const sourceHtml = await response?.text();
        await appPage.close();
        expect(sourceHtml).toContain(
          'It rendered without throwing an assertion error',
        );
      });
    });
  });

  describe('build-ssr', () => {
    it('should not contain "assert" or "invariant" in production', async () => {
      const backendUrl = `http://localhost:8011`;

      const build = await sku('build-ssr', [
        '--config',
        'sku.config.webpack.ts',
      ]);
      await expect(build).toMatchExitCode(0);

      const server = await node(['dist/server.cjs']);
      expect(
        await server.findByText('Server started on port 8011'),
      ).toBeInTheConsole();

      const appPage = await createPage();
      const response = await appPage.goto(backendUrl);
      const sourceHtml = await response?.text();
      expect(sourceHtml).toContain(
        'It rendered without throwing an assertion error',
      );
    });
  });

  describe('test', () => {
    it('should keep "assert" and "invariant" in tests', async () => {
      const test = await sku('test', [
        '--config',
        'sku.config.webpack.ts',
        '--run',
        '--reporter=verbose',
      ]);
      expect(await test.findByText('assert should throw')).toBeInTheConsole();
      expect(
        await test.findByText('Test Files 1 passed (1)'),
      ).toBeInTheConsole();
      await expect(test).toMatchExitCode(0);
    });
  });
});
