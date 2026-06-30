import { describe, beforeAll, it, expect } from 'vitest';
import { dirContentsToObject, getPort } from '@sku-private/test-utils';

import { getAppSnapshot } from '@sku-private/playwright';

import { skipCleanup, scopeToFixture } from '@sku-private/testing-library';

const { sku, fixturePath } = scopeToFixture('custom-src-paths');

/**
 * srcPaths is a webpack-only field, so only running webpack tests.
 */

describe('custom-src-paths', () => {
  describe('start', async () => {
    it('should start a development server', async () => {
      const port = await getPort();
      const url = `http://localhost:${port}`;

      const start = await sku('start', ['--strict-port', `--port=${port}`]);
      expect(
        await start.findByText('Starting development server'),
      ).toBeInTheConsole();

      const snapshot = await getAppSnapshot({ url });
      expect(snapshot).toMatchSnapshot();
    });

    it('should fail if `srcPaths` is missing values', async () => {
      const start = await sku('start', ['--config=sku.config.bad.ts']);
      expect(
        await start.findByText(
          // if `srcPaths` values are missing then the files won't be passed to webpack,
          // leading to webpack not knowing how to process the file (in the case of .ts files at least).
          // This is the standard error message for webpack when that happens.
          'You may need an appropriate loader to handle this file type',
        ),
      ).toBeInTheConsole();
    });
  });

  describe('build', async () => {
    const port = await getPort();
    const url = `http://localhost:${port}`;
    const portArgs = ['--strict-port', `--port=${port}`];

    beforeAll(async () => {
      const build = await sku('build');
      await build.findByText('Build complete');

      const serve = await sku('serve', portArgs);
      await serve.findByText('Server started');
    });

    it('should generate the expected files', async ({ task }) => {
      skipCleanup(task.id);
      const files = await dirContentsToObject(fixturePath('dist'));
      expect(files).toMatchSnapshot();
    });

    it('should create valid app', async ({ task }) => {
      skipCleanup(task.id);

      const app = await getAppSnapshot({ url });
      expect(app).toMatchSnapshot();
    });
  });
});

describe('format', () => {
  it('should format successfully', async () => {
    const format = await sku('format');
    expect(await format.findByText('Formatting complete')).toBeInTheConsole();
  });
});

describe('lint', () => {
  it('should lint successfully', async () => {
    const lint = await sku('lint');
    expect(await lint.findByText('Linting complete')).toBeInTheConsole();
  });
});
