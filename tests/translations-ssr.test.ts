import { describe, beforeAll, afterAll, it } from 'vitest';
import { getAppSnapshot } from '@sku-private/vitest-utils';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  runSkuScriptInDir,
  waitForUrls,
  createCancelSignal,
} from '@sku-private/test-utils';

import skuSsrConfig from '@sku-fixtures/translations/sku-ssr.config.ts';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/translations/sku-ssr.config.ts'),
);

assert(skuSsrConfig.serverPort, 'sku config has serverPort');
const getTestConfig = (skuConfig: typeof skuSsrConfig) => ({
  backendUrl: `http://localhost:${skuConfig.serverPort}`,
  targetDirectory: path.join(__dirname, skuConfig.target),
});

describe('ssr translations', () => {
  const { cancel, signal } = createCancelSignal();
  const { backendUrl } = getTestConfig(skuSsrConfig);

  beforeAll(async () => {
    runSkuScriptInDir('start-ssr', appDir, {
      args: ['--config=sku-ssr.config.ts'],
      signal,
    });
    await waitForUrls(backendUrl);
  });

  afterAll(async () => {
    cancel();
  });

  it('should render en', async ({ expect }) => {
    const app = await getAppSnapshot({ expect, url: `${backendUrl}/en` });
    expect(app).toMatchSnapshot();
  });

  it('should render fr', async ({ expect }) => {
    const app = await getAppSnapshot({ expect, url: `${backendUrl}/fr` });
    expect(app).toMatchSnapshot();
  });

  it('should render en-PSEUDO', async ({ expect }) => {
    const app = await getAppSnapshot({
      expect,
      url: `${backendUrl}/en?pseudo=true`,
    });
    expect(app).toMatchSnapshot();
  });
});
