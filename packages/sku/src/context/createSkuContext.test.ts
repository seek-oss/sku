import { describe, it, expect, afterEach } from 'vitest';
import { createFixture } from 'fs-fixture';
import { setCwd } from '@sku-private/utils';

import { createSkuContext } from './createSkuContext.js';

const createSsrFixture = (cspConfig: Record<string, unknown>) =>
  createFixture({
    'package.json': JSON.stringify({ name: 'csp-context-test' }),
    'sku.config.mjs': `export default ${JSON.stringify({
      bundler: 'vite',
      buildType: 'ssr',
      sites: ['default'],
      ...cspConfig,
    })};`,
  });

describe('createSkuContext — CSP extra sources', () => {
  const originalCwd = process.cwd();

  afterEach(() => {
    setCwd(originalCwd);
  });

  it('defaults both maps to empty', async () => {
    await using fixture = await createSsrFixture({});
    setCwd(fixture.path);

    const context = await createSkuContext({});

    expect(context.cspExtraSources).toEqual({});
    expect(context.cspReportOnlyExtraSources).toEqual({});
  });

  it('defaults the Report-Only map to the enforcing map', async () => {
    const cspExtraSources = {
      'connect-src': ['https://browser-intake-datadoghq.com'],
    };
    await using fixture = await createSsrFixture({ cspExtraSources });
    setCwd(fixture.path);

    const context = await createSkuContext({});

    expect(context.cspExtraSources).toEqual(cspExtraSources);
    expect(context.cspReportOnlyExtraSources).toEqual(cspExtraSources);
  });

  it('uses the Report-Only map when configured', async () => {
    await using fixture = await createSsrFixture({
      cspExtraSources: { 'connect-src': ['https://enforced.example.com'] },
      cspReportOnlyExtraSources: {
        'connect-src': ['https://report-only.example.com'],
      },
    });
    setCwd(fixture.path);

    const context = await createSkuContext({});

    expect(context.cspExtraSources).toEqual({
      'connect-src': ['https://enforced.example.com'],
    });
    expect(context.cspReportOnlyExtraSources).toEqual({
      'connect-src': ['https://report-only.example.com'],
    });
  });
});
