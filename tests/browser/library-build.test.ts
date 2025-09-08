import { describe, it, expect } from 'vitest';
import { dirContentsToObject } from '@sku-private/test-utils';

import { getAppSnapshot } from '@sku-private/puppeteer';

import { scopeToFixture } from '@sku-private/testing-library';

const { sku, fixturePath } = scopeToFixture('library-build');

describe('library-build', () => {
  describe('build', () => {
    it('should generate the expected files', async () => {
      const build = await sku('build');
      expect(await build.findByText('Sku build complete')).toBeInTheConsole();

      const files = await dirContentsToObject(fixturePath('dist'));
      expect(files).toMatchSnapshot();
    });
  });

  describe('start', () => {
    it('should start a development server', async () => {
      const devServerUrl = `http://localhost:8085`;

      const start = await sku('start');
      expect(
        await start.findByText('Starting development server'),
      ).toBeInTheConsole();

      const snapshot = await getAppSnapshot({ url: devServerUrl, expect });
      expect(snapshot).toMatchSnapshot();
    });
  });
});
