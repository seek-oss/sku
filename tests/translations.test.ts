import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { getAppSnapshot } from '@sku-private/vitest-utils';
import assert from 'node:assert/strict';
import path from 'node:path';
import { runSkuScriptInDir, waitForUrls } from '@sku-private/test-utils';

import skuConfigImport from '@sku-fixtures/translations/sku.config.ts';
import type { ChildProcess } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/translations/sku.config.ts'),
);

const skuConfig = skuConfigImport as unknown as typeof skuConfigImport.default;

assert(skuConfig.port, 'sku config has port');
const baseUrl = `http://localhost:${skuConfig.port}`;

describe('translations', () => {
  let process: ChildProcess;

  beforeAll(async () => {
    await runSkuScriptInDir('build', appDir);
    process = await runSkuScriptInDir('serve', appDir);
    await waitForUrls(`${baseUrl}/en`);
  });

  afterAll(() => {
    process.kill();
  });

  it('should render en', async () => {
    const app = await getAppSnapshot(`${baseUrl}/en`);
    expect(app).toMatchSnapshot();
  });

  it('should render fr', async () => {
    const app = await getAppSnapshot(`${baseUrl}/fr`);
    expect(app).toMatchSnapshot();
  });

  it('should render en-PSEUDO post-hydration', async () => {
    const app = await getAppSnapshot(`${baseUrl}/en?pseudo=true`);
    expect(app).toMatchSnapshot();
  });

  it('should support query parameters', async () => {
    const app = await getAppSnapshot(`${baseUrl}/en?a=1`);
    expect(app).toMatchSnapshot();
  });
});
