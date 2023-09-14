import assert from 'node:assert/strict';
import path from 'path';
import {
  runSkuScriptInDir,
  waitForUrls,
  getAppSnapshot,
} from '@sku-private/test-utils';

import skuConfig from '@sku-fixtures/translations/sku.config';
import type { ChildProcess } from 'node:child_process';

const appDir = path.dirname(
  require.resolve('@sku-fixtures/translations/sku.config.ts'),
);

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
