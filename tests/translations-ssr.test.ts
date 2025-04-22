import { describe, beforeAll, afterAll, it } from 'vitest';
import { getAppSnapshot } from '@sku-private/vitest-utils';
import assert from 'node:assert/strict';
import path from 'node:path';
import { runSkuScriptInDir, waitForUrls } from '@sku-private/test-utils';

import skuSsrConfigImport from '@sku-fixtures/translations/sku-ssr.config.ts';
import type { ChildProcess } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/translations/sku-ssr.config.ts'),
);

const skuSsrConfig = skuSsrConfigImport;

assert(skuSsrConfig.serverPort, 'sku config has serverPort');
const getTestConfig = (skuConfig: typeof skuSsrConfig) => ({
  backendUrl: `http://localhost:${skuConfig.serverPort}`,
  targetDirectory: path.join(__dirname, skuConfig.target),
});

describe('ssr translations', () => {
  let server: ChildProcess;
  const { backendUrl } = getTestConfig(skuSsrConfig);

  beforeAll(async () => {
    server = await runSkuScriptInDir('start-ssr', appDir, [
      '--config=sku-ssr.config.ts',
    ]);
    await waitForUrls(backendUrl);
  });

  afterAll(async () => {
    await server.kill();
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
