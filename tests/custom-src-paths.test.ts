import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import path from 'node:path';
import {
  dirContentsToObject,
  runSkuScriptInDir,
  waitForUrls,
} from '@sku-private/test-utils';

import { getAppSnapshot } from '@sku-private/vitest-utils';

import skuConfigImport from '@sku-fixtures/custom-src-paths/sku.config.ts';
import type { ChildProcess } from 'node:child_process';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/custom-src-paths/sku.config.ts'),
);

// TODO: fix this casting.
const skuConfig = skuConfigImport as unknown as typeof skuConfigImport.default;

const targetDirectory = `${appDir}/dist`;
const url = `http://localhost:${skuConfig.port}`;

describe('custom-src-paths', () => {
  describe('start', () => {
    let process: ChildProcess;

    beforeAll(async () => {
      process = await runSkuScriptInDir('start', appDir);
      await waitForUrls(url);
    });

    afterAll(async () => {
      await process.kill();
    });

    it('should start a development server', async () => {
      const snapshot = await getAppSnapshot(url);
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('build', () => {
    let process: ChildProcess;

    beforeAll(async () => {
      await runSkuScriptInDir('build', appDir);
      process = await runSkuScriptInDir('serve', appDir);
      await waitForUrls(url);
    });

    afterAll(async () => {
      await process.kill();
    });

    it('should generate the expected files', async () => {
      const files = await dirContentsToObject(targetDirectory);
      expect(files).toMatchSnapshot();
    });

    it('should create valid app', async () => {
      const app = await getAppSnapshot(url);
      expect(app).toMatchSnapshot();
    });
  });

  describe('format', () => {
    it('should format successfully', async () => {
      const { child } = await runSkuScriptInDir('format', appDir);
      expect(child.exitCode).toEqual(0);
    });
  });

  describe('lint', () => {
    it('should lint successfully', async () => {
      const { child } = await runSkuScriptInDir('lint', appDir);
      expect(child.exitCode).toEqual(0);
    });
  });
});
