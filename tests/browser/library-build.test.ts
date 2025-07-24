import { describe, it } from 'vitest';
import { dirContentsToObject } from '@sku-private/test-utils';

import { getAppSnapshot } from '@sku-private/puppeteer';

import { scopeToFixture } from '@sku-private/testing-library';

const { render, joinPath } = scopeToFixture('library-build');

describe('library-build', () => {
  describe('build', () => {
    it('should generate the expected files', async ({ expect }) => {
      const build = await render('build');
      expect(await build.findByText('Sku build complete')).toBeInTheConsole();

      const files = await dirContentsToObject(joinPath('dist'));
      expect(files).toMatchSnapshot();
    });
  });

  describe('start', () => {
    it('should start a development server', async ({ expect }) => {
      const devServerUrl = `http://localhost:8085`;

      const start = await render('start');
      expect(
        await start.findByText('Starting development server'),
      ).toBeInTheConsole();

      const snapshot = await getAppSnapshot({ url: devServerUrl, expect });
      expect(snapshot).toMatchSnapshot();
    });
  });
});
