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

describe('validateConfig — CSP extra sources', () => {
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

  it.each(['cspExtraSources', 'cspReportOnlyExtraSources'] as const)(
    'accepts supported directives and sources in %s for SSR',
    (option) => {
      expect(() =>
        validateSsr({
          bundler: 'vite',
          [option]: {
            'connect-src': ['https://browser-intake-datadoghq.com'],
            'frame-src': ['https://www.youtube.com'],
            'img-src': ['https://*.example.com', 'blob:'],
          },
        }),
      ).not.toThrow();

      expect(exitSpy).not.toHaveBeenCalled();
    },
  );

  it.each(['cspExtraSources', 'cspReportOnlyExtraSources'] as const)(
    'rejects an unsupported directive in %s',
    (option) => {
      expect(() =>
        validateSsr({
          bundler: 'vite',
          [option]: { 'default-src': ['https://example.com'] },
        } as SkuConfig),
      ).toThrow('process.exit: 1');

      const logged = logSpy.mock.calls.join('\n');
      expect(logged).toContain(`${option}['default-src']`);
      expect(logged).toContain('not a supported directive');
    },
  );

  it.each(["'unsafe-eval'", "'nonce-abc'", "'sha256-abc='"])(
    'rejects the quoted source %s',
    (source) => {
      expect(() =>
        validateSsr({
          bundler: 'vite',
          cspExtraSources: { 'style-src': [source] },
        }),
      ).toThrow('process.exit: 1');

      const logged = logSpy.mock.calls.join('\n');
      expect(logged).toContain("cspExtraSources['style-src']");
      expect(logged).toContain('Quoted sources');
    },
  );

  it('rejects a bare *', () => {
    expect(() =>
      validateSsr({
        bundler: 'vite',
        cspExtraSources: { 'img-src': ['*'] },
      }),
    ).toThrow('process.exit: 1');

    const logged = logSpy.mock.calls.join('\n');
    expect(logged).toContain("cspExtraSources['img-src']");
    expect(logged).toContain('allows any origin');
  });

  it.each(['https://a.com https://b.com', 'https://a.com; img-src *'])(
    'rejects the multi-value source %s',
    (source) => {
      expect(() =>
        validateSsr({
          bundler: 'vite',
          cspExtraSources: { 'connect-src': [source] },
        }),
      ).toThrow('process.exit: 1');

      const logged = logSpy.mock.calls.join('\n');
      expect(logged).toContain('single value');
    },
  );

  it.each([
    ['cspExtraScriptSrcHosts', "cspExtraSources['script-src']"],
    [
      'cspReportOnlyExtraScriptSrcHosts',
      "cspReportOnlyExtraSources['script-src']",
    ],
  ] as const)('rejects %s for SSR and points to %s', (option, replacement) => {
    expect(() =>
      validateSsr({
        bundler: 'vite',
        [option]: ['https://cdn.example.com'],
      }),
    ).toThrow('process.exit: 1');

    const logged = logSpy.mock.calls.join('\n');
    expect(logged).toContain(`SSR does not support '${option}'`);
    expect(logged).toContain(replacement);
  });

  it.each([
    ['vite', 'cspExtraSources', 'cspExtraScriptSrcHosts'],
    ['vite', 'cspReportOnlyExtraSources', 'cspReportOnlyExtraScriptSrcHosts'],
    ['webpack', 'cspExtraSources', 'cspExtraScriptSrcHosts'],
  ] as const)(
    'rejects %s static apps setting %s and points to %s',
    (bundler, option, replacement) => {
      const appSkuConfig = {
        bundler,
        [option]: { 'script-src': ['https://cdn.example.com'] },
      } as SkuConfig;

      expect(() =>
        validateConfig({ ...defaultSkuConfig, ...appSkuConfig }, appSkuConfig),
      ).toThrow('process.exit: 1');

      const logged = logSpy.mock.calls.join('\n');
      expect(logged).toContain(`'${option}' is only supported with`);
      expect(logged).toContain(`Use '${replacement}' instead`);
    },
  );

  it.each(['vite', 'webpack'] as const)(
    'accepts cspExtraScriptSrcHosts for static %s apps',
    (bundler) => {
      const appSkuConfig = {
        bundler,
        cspExtraScriptSrcHosts: ['https://cdn.example.com'],
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
