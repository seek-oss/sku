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

describe('createSkuContext — SSR csp', () => {
  const originalCwd = process.cwd();

  afterEach(() => {
    setCwd(originalCwd);
  });

  it('disables both policies when csp is not set', async () => {
    await using fixture = await createSsrFixture({});
    setCwd(fixture.path);

    const context = await createSkuContext({});

    expect(context.cspEnabled).toBe(false);
    expect(context.cspReportOnlyEnabled).toBe(false);
    expect(context.cspExtraSources).toEqual({});
    expect(context.cspReportOnlyExtraSources).toEqual({});
    expect(context.cspReportTo).toBeUndefined();
    expect(context.cspReportOnlyReportTo).toBeUndefined();
  });

  it('enables a policy set to true with nothing extra', async () => {
    await using fixture = await createSsrFixture({
      csp: { enforced: true },
    });
    setCwd(fixture.path);

    const context = await createSkuContext({});

    expect(context.cspEnabled).toBe(true);
    expect(context.cspReportOnlyEnabled).toBe(false);
    expect(context.cspExtraSources).toEqual({});
    expect(context.cspReportTo).toBeUndefined();
  });

  it('enables Report-Only on its own', async () => {
    await using fixture = await createSsrFixture({
      csp: { reportOnly: true },
    });
    setCwd(fixture.path);

    const context = await createSkuContext({});

    expect(context.cspEnabled).toBe(false);
    expect(context.cspReportOnlyEnabled).toBe(true);
  });

  it('does not copy the enforced policy into Report-Only', async () => {
    await using fixture = await createSsrFixture({
      csp: {
        enforced: {
          extraSources: {
            'connect-src': ['https://browser-intake-datadoghq.com'],
          },
          reportTo: 'https://csp.example.com/report',
        },
        reportOnly: true,
      },
    });
    setCwd(fixture.path);

    const context = await createSkuContext({});

    expect(context.cspExtraSources).toEqual({
      'connect-src': ['https://browser-intake-datadoghq.com'],
    });
    expect(context.cspReportOnlyExtraSources).toEqual({});
    expect(context.cspReportOnlyReportTo).toBeUndefined();
  });

  it('names the reporting endpoints csp and csp-report-only', async () => {
    await using fixture = await createSsrFixture({
      csp: {
        enforced: { reportTo: 'https://csp.example.com/report' },
        reportOnly: { reportTo: 'https://csp.example.com/report' },
      },
    });
    setCwd(fixture.path);

    const context = await createSkuContext({});

    expect(context.cspReportTo).toEqual({
      endpoint: 'csp',
      url: 'https://csp.example.com/report',
    });
    expect(context.cspReportOnlyReportTo).toEqual({
      endpoint: 'csp-report-only',
      url: 'https://csp.example.com/report',
    });
  });
});
