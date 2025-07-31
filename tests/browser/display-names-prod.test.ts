import {
  describe,
  beforeAll,
  afterAll,
  it,
  expect as globalExpect,
} from 'vitest';
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
        globalExpect(
          await build.findByText('Sku build complete'),
        ).toBeInTheConsole();
      });

      it('should create build output', async ({ expect }) => {
        const distDir = fixturePath('dist');
        const files = await dirContentsToObject(distDir);
        expect(files).toMatchSnapshot();
      });

      it('should add displayNames to React components in rendered HTML', async ({
        expect,
      }) => {
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
  });

  afterAll(cleanup);
});
