import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { dirContentsToObject, getPort } from '@sku-private/test-utils';
import {
  scopeToFixture,
  bundlers,
  cleanup,
  type BundlerValues,
} from '@sku-private/testing-library';
import { createPage } from '@sku-private/playwright';

const { sku, fixturePath } = scopeToFixture('display-names-prod');

describe('display-names-prod', () => {
  describe.for(bundlers)('bundler: %s', (bundler) => {
    const args: BundlerValues<string[]> = {
      vite: ['--config', 'sku.config.vite.ts'],
      webpack: [],
    };

    afterAll(cleanup);

    describe('build', () => {
      beforeAll(async () => {
        const build = await sku('build', args[bundler]);
        await build.findByText('Sku build complete');
      });

      it('should create build output', async () => {
        const distDir = fixturePath('dist');
        const files = await dirContentsToObject(distDir);
        expect(files).toMatchSnapshot();
      });

      it('should add displayNames to React components in rendered HTML', async () => {
        const distDir = fixturePath('dist');
        const files = await dirContentsToObject(distDir);

        const htmlContent = files['index.html'];
        expect(htmlContent).toBeDefined();

        expect(htmlContent).toContain('Button.displayName: <!-- -->Button');
        expect(htmlContent).toContain('Card.displayName: <!-- -->Card');
        expect(htmlContent).toContain('Header.displayName: <!-- -->Header');
        expect(htmlContent).toContain(
          'MemoFooter.displayName: <!-- -->MemoFooter',
        );
        expect(htmlContent).toContain('Input.displayName: <!-- -->Input');
        expect(htmlContent).toContain('PublicBox.displayName: <!-- -->Box');

        expect(htmlContent).not.toContain('displayName: <!-- -->undefined');
      });
    });

    describe('start (development)', () => {
      it('should NOT add displayNames in development mode', async () => {
        const port = await getPort();
        const url = `http://localhost:${port}`;

        const start = await sku('start', [
          ...args[bundler],
          '--strict-port',
          `--port=${port}`,
        ]);

        expect(
          await start.findByText('Starting development server'),
        ).toBeInTheConsole();

        const appPage = await createPage();
        const response = await appPage.goto(url);
        const sourceHtml = await response?.text();
        await appPage.close();

        expect(sourceHtml).toBeDefined();

        expect(sourceHtml).toContain('Button.displayName: <!-- -->undefined');
        expect(sourceHtml).toContain('Card.displayName: <!-- -->undefined');
        expect(sourceHtml).toContain('Header.displayName: <!-- -->undefined');
        expect(sourceHtml).toContain(
          'MemoFooter.displayName: <!-- -->undefined',
        );
        expect(sourceHtml).toContain('Input.displayName: <!-- -->undefined');
        expect(sourceHtml).toContain('PublicBox.displayName: <!-- -->Box'); // This one is manually assigned
      });
    });
  });
});
