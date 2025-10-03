import { describe, it, expect } from 'vitest';

import {
  bundlers,
  type BundlerValues,
  scopeToFixture,
} from '@sku-private/testing-library';
import { getPort } from '@sku-private/test-utils';

const { sku, node } = scopeToFixture('assertion-removal');

describe('assertion-removal', () => {
  describe.for(bundlers)('bundler %s', (bundler) => {
    describe('build', async () => {
      const args: BundlerValues<string[]> = {
        vite: ['--config', 'sku.config.vite.ts'],
        webpack: [],
      };

      it('should not contain "assert" or "invariant" in production', async () => {
        const port = await getPort();
        const url = `http://localhost:${port}`;

        const build = await sku('build', args[bundler]);
        expect(await build.findByText('Sku build complete')).toBeInTheConsole();

        const serve = await sku('serve', ['--strict-port', `--port=${port}`]);
        expect(await serve.findByText('Server started')).toBeInTheConsole();

        const appPage = await browser.newPage();
        const response = await appPage.goto(url, { waitUntil: 'networkidle0' });
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

      const build = await sku('build-ssr');
      expect(await build.findByText('Sku build complete')).toBeInTheConsole();

      const server = await node(['dist/server.cjs']);
      expect(
        await server.findByText('Server started on port 8011'),
      ).toBeInTheConsole();

      const appPage = await browser.newPage();
      const response = await appPage.goto(backendUrl);
      const sourceHtml = await response?.text();
      expect(sourceHtml).toContain(
        'It rendered without throwing an assertion error',
      );
    });
  });

  describe('test', () => {
    it('should keep "assert" and "invariant" in tests', async () => {
      const test = await sku('test');
      expect(await test.findByError('assert should throw')).toBeInTheConsole();
      expect(await test.findByError('1 passed, 1 total')).toBeInTheConsole();
    });
  });
});
