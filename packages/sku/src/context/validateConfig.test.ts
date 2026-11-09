import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest';
import { createFixture } from 'fs-fixture';
import { setCwd } from '@sku-private/utils';

import validateConfig from './validateConfig.js';
import defaultSkuConfig from './defaultSkuConfig.js';
import type { SkuConfig } from '../types/types.js';

describe('validateConfig — SSR public assets folder', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;
  const originalCwd = process.cwd();

  beforeEach(() => {
    // `process.exit` is typed to return `never`, so throw to model that the
    // process would stop here and to halt execution in the test.
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit: ${code}`);
    });
    logSpy = vi.spyOn(globalThis.console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    setCwd(originalCwd);
    vi.restoreAllMocks();
  });

  it('hard-errors when the configured public directory exists', async () => {
    await using fixture = await createFixture({
      public: {
        'robots.txt': 'User-agent: *\n',
      },
    });

    setCwd(fixture.path);

    expect(() =>
      validateConfig(
        {
          ...defaultSkuConfig,
          bundler: 'vite',
          buildType: 'ssr',
          public: 'public',
          sites: ['default'],
        },
        { bundler: 'vite', buildType: 'ssr', sites: ['default'] },
      ),
    ).toThrow('process.exit: 1');

    expect(exitSpy).toHaveBeenCalledWith(1);
    const logged = logSpy.mock.calls.join('\n');
    expect(logged).toContain('SSR does not support the');
    expect(logged).toContain('public');
    expect(logged).toContain('Import assets from modules instead');
  });

  it('does not error when the public directory is absent', async () => {
    await using fixture = await createFixture({});

    setCwd(fixture.path);

    expect(() =>
      validateConfig(
        {
          ...defaultSkuConfig,
          bundler: 'vite',
          buildType: 'ssr',
          public: 'public',
          sites: ['default'],
        },
        { bundler: 'vite', buildType: 'ssr', sites: ['default'] },
      ),
    ).not.toThrow();

    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('does not error for static Vite when a public directory exists', async () => {
    await using fixture = await createFixture({
      public: {
        'robots.txt': 'User-agent: *\n',
      },
    });

    setCwd(fixture.path);

    expect(() =>
      validateConfig(
        {
          ...defaultSkuConfig,
          bundler: 'vite',
          buildType: 'static',
          public: 'public',
        },
        { bundler: 'vite', buildType: 'static' },
      ),
    ).not.toThrow();

    expect(exitSpy).not.toHaveBeenCalled();
  });
});

describe('validateConfig — SSR dangerouslySetViteConfig', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit: ${code}`);
    });
    logSpy = vi.spyOn(globalThis.console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('hard-errors when dangerouslySetViteConfig is set', () => {
    expect(() =>
      validateConfig(
        {
          ...defaultSkuConfig,
          bundler: 'vite',
          buildType: 'ssr',
          sites: ['default'],
          dangerouslySetViteConfig: () => ({}),
        },
        {
          bundler: 'vite',
          buildType: 'ssr',
          sites: ['default'],
          dangerouslySetViteConfig: () => ({}),
        },
      ),
    ).toThrow('process.exit: 1');

    expect(exitSpy).toHaveBeenCalledWith(1);
    const logged = logSpy.mock.calls.join('\n');
    expect(logged).toContain('SSR does not support');
    expect(logged).toContain('dangerouslySetViteConfig');
    expect(logged).toContain('sku-support');
  });

  it('does not error when dangerouslySetViteConfig is omitted', () => {
    expect(() =>
      validateConfig(
        {
          ...defaultSkuConfig,
          bundler: 'vite',
          buildType: 'ssr',
          sites: ['default'],
        },
        { bundler: 'vite', buildType: 'ssr', sites: ['default'] },
      ),
    ).not.toThrow();

    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('does not error for static Vite when dangerouslySetViteConfig is set', () => {
    expect(() =>
      validateConfig(
        {
          ...defaultSkuConfig,
          bundler: 'vite',
          buildType: 'static',
          dangerouslySetViteConfig: () => ({}),
        },
        {
          bundler: 'vite',
          buildType: 'static',
          dangerouslySetViteConfig: () => ({}),
        },
      ),
    ).not.toThrow();

    expect(exitSpy).not.toHaveBeenCalled();
  });
});

describe('validateConfig — SSR vitePlugins', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit: ${code}`);
    });
    logSpy = vi.spyOn(globalThis.console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('hard-errors when vitePlugins is set', () => {
    expect(() =>
      validateConfig(
        {
          ...defaultSkuConfig,
          bundler: 'vite',
          buildType: 'ssr',
          sites: ['default'],
          vitePlugins: [{ name: 'consumer-plugin' }],
        },
        {
          bundler: 'vite',
          buildType: 'ssr',
          sites: ['default'],
          vitePlugins: [{ name: 'consumer-plugin' }],
        },
      ),
    ).toThrow('process.exit: 1');

    expect(exitSpy).toHaveBeenCalledWith(1);
    const logged = logSpy.mock.calls.join('\n');
    expect(logged).toContain('SSR does not support');
    expect(logged).toContain('vitePlugins');
    expect(logged).toContain('sku-support');
  });

  it('does not error when vitePlugins is omitted', () => {
    expect(() =>
      validateConfig(
        {
          ...defaultSkuConfig,
          bundler: 'vite',
          buildType: 'ssr',
          sites: ['default'],
        },
        { bundler: 'vite', buildType: 'ssr', sites: ['default'] },
      ),
    ).not.toThrow();

    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('does not error for static Vite when vitePlugins is set', () => {
    expect(() =>
      validateConfig(
        {
          ...defaultSkuConfig,
          bundler: 'vite',
          buildType: 'static',
          vitePlugins: [{ name: 'consumer-plugin' }],
        },
        {
          bundler: 'vite',
          buildType: 'static',
          vitePlugins: [{ name: 'consumer-plugin' }],
        },
      ),
    ).not.toThrow();

    expect(exitSpy).not.toHaveBeenCalled();
  });
});

describe('validateConfig — SSR sites', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit: ${code}`);
    });
    vi.spyOn(globalThis.console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not error when sites is empty (soft-defaults at runtime)', () => {
    expect(() =>
      validateConfig(
        {
          ...defaultSkuConfig,
          bundler: 'vite',
          buildType: 'ssr',
          sites: [],
        },
        { bundler: 'vite', buildType: 'ssr' },
      ),
    ).not.toThrow();

    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('does not error when sites has at least one name', () => {
    expect(() =>
      validateConfig(
        {
          ...defaultSkuConfig,
          bundler: 'vite',
          buildType: 'ssr',
          sites: ['default'],
        },
        { bundler: 'vite', buildType: 'ssr', sites: ['default'] },
      ),
    ).not.toThrow();

    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('does not error for static Vite when sites is empty', () => {
    expect(() =>
      validateConfig(
        {
          ...defaultSkuConfig,
          bundler: 'vite',
          buildType: 'static',
          sites: [],
        },
        { bundler: 'vite', buildType: 'static' },
      ),
    ).not.toThrow();

    expect(exitSpy).not.toHaveBeenCalled();
  });
});

describe('validateConfig — SSR csp', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit: ${code}`);
    });
    logSpy = vi.spyOn(globalThis.console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const validateSsr = (appSkuConfig: SkuConfig) =>
    validateConfig(
      {
        ...defaultSkuConfig,
        bundler: 'vite',
        buildType: 'ssr',
        sites: ['default'],
        ...appSkuConfig,
      },
      {
        bundler: 'vite',
        buildType: 'ssr',
        sites: ['default'],
        ...appSkuConfig,
      },
    );

  const getValidationErrors = (appSkuConfig: SkuConfig) => {
    expect(() => validateSsr(appSkuConfig)).toThrow('process.exit: 1');

    return logSpy.mock.calls.join('\n');
  };

  it.each([
    { enforced: true },
    { reportOnly: true },
    { enforced: true, reportOnly: true },
  ] as const)('accepts the policies %j', (csp) => {
    expect(() => validateSsr({ bundler: 'vite', csp })).not.toThrow();

    expect(exitSpy).not.toHaveBeenCalled();
  });

  it.each(['enforced', 'reportOnly'] as const)(
    'accepts supported directives, sources and a reportTo URL in csp.%s',
    (policy) => {
      expect(() =>
        validateSsr({
          bundler: 'vite',
          csp: {
            [policy]: {
              extraSources: {
                'connect-src': ['https://browser-intake-datadoghq.com'],
                'frame-src': ['https://www.youtube.com'],
                'img-src': ['https://*.example.com', 'blob:'],
              },
              reportTo: 'https://csp.example.com/report',
            },
          },
        }),
      ).not.toThrow();

      expect(exitSpy).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['csp', 'csp.enforced.reportTo', "'csp'"],
    ['csp-report-only', 'csp.reportOnly.reportTo', "'csp-report-only'"],
  ] as const)(
    'rejects the endpoint name %s as reportTo in %s',
    (reportTo, field, endpoint) => {
      const policy = field.split('.')[1] as 'enforced' | 'reportOnly';

      const errors = getValidationErrors({
        bundler: 'vite',
        csp: { [policy]: { reportTo } },
      });
      expect(errors).toContain(field);
      expect(errors).toContain('absolute http: or https: URL');
      expect(errors).toContain(`sku names the endpoint ${endpoint}`);
    },
  );

  it('rejects a reportTo URL that is not http or https', () => {
    const errors = getValidationErrors({
      bundler: 'vite',
      csp: { enforced: { reportTo: 'ftp://example.com' } },
    });
    expect(errors).toContain('csp.enforced.reportTo');
  });

  it('rejects a policy that is not true or an object', () => {
    const errors = getValidationErrors({
      bundler: 'vite',
      csp: { enforced: false },
    } as unknown as SkuConfig);
    expect(errors).toContain('csp.enforced');
    expect(errors).toContain('must be true or an object');
  });

  it('rejects unknown keys in csp and in a policy', () => {
    const errors = getValidationErrors({
      bundler: 'vite',
      csp: { enforce: true, reportOnly: { delivery: 'header' } },
    } as unknown as SkuConfig);
    expect(errors).toContain('csp.enforce');
    expect(errors).toContain('csp.reportOnly.delivery');
  });

  it.each(['enforced', 'reportOnly'] as const)(
    'rejects an unsupported directive in csp.%s',
    (policy) => {
      const errors = getValidationErrors({
        bundler: 'vite',
        csp: {
          [policy]: {
            extraSources: { 'default-src': ['https://example.com'] },
          },
        },
      } as SkuConfig);
      expect(errors).toContain(`csp.${policy}.extraSources['default-src']`);
      expect(errors).toContain('not a supported directive');
    },
  );

  it('rejects sources that are not an array of strings', () => {
    const errors = getValidationErrors({
      bundler: 'vite',
      csp: {
        enforced: { extraSources: { 'img-src': 'https://example.com' } },
      },
    } as unknown as SkuConfig);
    expect(errors).toContain("csp.enforced.extraSources['img-src']");
    expect(errors).toContain('must be an array of strings');
  });

  it.each(["'unsafe-eval'", "'nonce-abc'", "'sha256-abc='"])(
    'rejects the quoted source %s',
    (source) => {
      const errors = getValidationErrors({
        bundler: 'vite',
        csp: { enforced: { extraSources: { 'style-src': [source] } } },
      });
      expect(errors).toContain("csp.enforced.extraSources['style-src']");
      expect(errors).toContain('Quoted sources');
    },
  );

  it('rejects a bare *', () => {
    const errors = getValidationErrors({
      bundler: 'vite',
      csp: { enforced: { extraSources: { 'img-src': ['*'] } } },
    });
    expect(errors).toContain("csp.enforced.extraSources['img-src']");
    expect(errors).toContain('allows any origin');
  });

  it.each(['https:', 'data:', 'blob:'])(
    'rejects the scheme-only script-src source %s',
    (source) => {
      const errors = getValidationErrors({
        bundler: 'vite',
        csp: { reportOnly: { extraSources: { 'script-src': [source] } } },
      });
      expect(errors).toContain("csp.reportOnly.extraSources['script-src']");
      expect(errors).toContain('allows scripts from any origin');
    },
  );

  it('accepts scheme-only sources outside script-src', () => {
    expect(() =>
      validateSsr({
        bundler: 'vite',
        csp: {
          enforced: {
            extraSources: { 'worker-src': ['blob:'], 'img-src': ['data:'] },
          },
        },
      }),
    ).not.toThrow();

    expect(exitSpy).not.toHaveBeenCalled();
  });

  it.each(['https://a.com https://b.com', 'https://a.com; img-src *'])(
    'rejects the multi-value source %s',
    (source) => {
      const errors = getValidationErrors({
        bundler: 'vite',
        csp: { enforced: { extraSources: { 'connect-src': [source] } } },
      });
      expect(errors).toContain('single value');
    },
  );

  it.each([
    ['cspEnabled', true, 'csp.enforced'],
    [
      'cspExtraScriptSrcHosts',
      ['https://cdn.example.com'],
      "csp.enforced.extraSources['script-src']",
    ],
    ['cspReportTo', 'https://csp.example.com/report', 'csp.enforced.reportTo'],
    ['cspReportOnlyEnabled', true, 'csp.reportOnly'],
    [
      'cspReportOnlyExtraScriptSrcHosts',
      ['https://cdn.example.com'],
      "csp.reportOnly.extraSources['script-src']",
    ],
    [
      'cspReportOnlyReportTo',
      'https://csp.example.com/report',
      'csp.reportOnly.reportTo',
    ],
  ] as const)(
    'rejects %s for SSR and points to %s',
    (option, value, replacement) => {
      const errors = getValidationErrors({
        bundler: 'vite',
        [option]: value,
      } as SkuConfig);
      expect(errors).toContain(`SSR does not support '${option}'`);
      expect(errors).toContain(`Use '${replacement}' instead`);
    },
  );

  it('rejects cspDelivery for SSR', () => {
    const errors = getValidationErrors({
      bundler: 'vite',
      cspDelivery: 'header',
    });
    expect(errors).toContain("SSR does not support 'cspDelivery'");
    expect(errors).toContain('remove it');
  });

  it.each(['vite', 'webpack'] as const)(
    'rejects csp for static %s apps',
    (bundler) => {
      const appSkuConfig = {
        bundler,
        csp: { enforced: true },
      } as SkuConfig;

      expect(() =>
        validateConfig({ ...defaultSkuConfig, ...appSkuConfig }, appSkuConfig),
      ).toThrow('process.exit: 1');

      const logged = logSpy.mock.calls.join('\n');
      expect(logged).toContain("'csp' is only supported with");
      expect(logged).toContain('csp*');
    },
  );

  it.each(['vite', 'webpack'] as const)(
    'accepts the flat CSP options for static %s apps',
    (bundler) => {
      const appSkuConfig = {
        bundler,
        cspEnabled: true,
        cspExtraScriptSrcHosts: ['https://cdn.example.com'],
        cspReportOnlyEnabled: true,
        cspReportOnlyExtraScriptSrcHosts: ['https://cdn.example.com'],
      } as SkuConfig;

      expect(() =>
        validateConfig({ ...defaultSkuConfig, ...appSkuConfig }, appSkuConfig),
      ).not.toThrow();

      expect(exitSpy).not.toHaveBeenCalled();
    },
  );
});

describe('validateConfig — distSubfolders', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit: ${code}`);
    });
    logSpy = vi.spyOn(globalThis.console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects the option with buildType ssr', () => {
    expect(() =>
      validateConfig({
        ...defaultSkuConfig,
        bundler: 'vite',
        buildType: 'ssr',
        sites: ['default'],
        distSubfolders: true,
      }),
    ).toThrow('process.exit: 1');

    expect(exitSpy).toHaveBeenCalledWith(1);
    const logged = logSpy.mock.calls.join('\n');
    expect(logged).toContain('distSubfolders');
    expect(logged).toContain('buildType: ssr');
  });

  it.each(['vite', 'webpack'] as const)(
    'accepts the option with static %s',
    (bundler) => {
      expect(() =>
        validateConfig({
          ...defaultSkuConfig,
          bundler,
          buildType: 'static',
          distSubfolders: true,
        }),
      ).not.toThrow();

      expect(exitSpy).not.toHaveBeenCalled();
    },
  );

  it.each([
    { reservedName: 'client', distSubfolders: true },
    { reservedName: 'rendered', distSubfolders: true },
    { reservedName: 'server', distSubfolders: true },
    { reservedName: 'client', distSubfolders: false },
    { reservedName: 'rendered', distSubfolders: false },
    { reservedName: 'server', distSubfolders: false },
  ])(
    'rejects a `$reservedName` environment when distSubfolders is $distSubfolders',
    ({ reservedName, distSubfolders }) => {
      expect(() =>
        validateConfig({
          ...defaultSkuConfig,
          environments: ['production', reservedName],
          distSubfolders,
        }),
      ).toThrow('process.exit: 1');

      const logged = logSpy.mock.calls.join('\n');
      expect(logged).toContain(reservedName);
      expect(logged).toContain('reserved');
    },
  );
});
