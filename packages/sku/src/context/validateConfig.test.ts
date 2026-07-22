import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest';
import { createFixture } from 'fs-fixture';
import { setCwd } from '@sku-private/utils';

import validateConfig from './validateConfig.js';
import defaultSkuConfig from './defaultSkuConfig.js';

describe('validateConfig — Vite SSR public assets folder', () => {
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
        },
        { bundler: 'vite', buildType: 'ssr' },
      ),
    ).toThrow('process.exit: 1');

    expect(exitSpy).toHaveBeenCalledWith(1);
    const logged = logSpy.mock.calls.join('\n');
    expect(logged).toContain('Vite SSR does not support the');
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
        },
        { bundler: 'vite', buildType: 'ssr' },
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

describe('validateConfig — Vite SSR dangerouslySetViteConfig', () => {
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
          dangerouslySetViteConfig: () => ({}),
        },
        {
          bundler: 'vite',
          buildType: 'ssr',
          dangerouslySetViteConfig: () => ({}),
        },
      ),
    ).toThrow('process.exit: 1');

    expect(exitSpy).toHaveBeenCalledWith(1);
    const logged = logSpy.mock.calls.join('\n');
    expect(logged).toContain('Vite SSR does not support');
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
        },
        { bundler: 'vite', buildType: 'ssr' },
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
