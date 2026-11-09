import { createFixture } from 'fs-fixture';
import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  findEntryChunk,
  resolveAssets,
  warnUnknownModuleIdsWithoutManifest,
  type ClientManifest,
} from './resolveAssets.js';

const manifest: ClientManifest = {
  'src/entry.tsx': {
    file: 'assets/entry.js',
    isEntry: true,
    imports: ['src/pages/about/about.tsx'],
  },
  'src/pages/about/about.tsx': {
    file: 'assets/about.js',
  },
};

describe('resolveAssets', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves modulepreloads for known moduleIds', () => {
    const assets = resolveAssets({
      manifest,
      publicPath: '/assets/',
      entry: manifest['src/entry.tsx'],
      moduleIds: ['src/pages/about/about.tsx'],
    });

    expect(assets.modulePreloads).toContain('/assets/assets/about.js');
  });

  it('resolves vocab language chunks by chunk name', () => {
    const assets = resolveAssets({
      manifest: {
        ...manifest,
        'virtual:vocab-en.json': {
          file: 'assets/en-translations.js',
          name: 'en-translations',
        },
      },
      publicPath: '/',
      entry: manifest['src/entry.tsx'],
      moduleIds: ['en-translations'],
    });

    expect(assets.modulePreloads).toContain('/assets/en-translations.js');
  });

  it('lists resolved moduleIds as required modules, without their imports', () => {
    const assets = resolveAssets({
      manifest: {
        ...manifest,
        'src/pages/home/home.tsx': {
          file: 'assets/home.js',
          imports: ['_shared.js'],
          css: ['assets/home.css'],
        },
        '_shared.js': { file: 'assets/shared.js' },
        'virtual:vocab-en.json': {
          file: 'assets/en-translations.js',
          name: 'en-translations',
        },
      },
      publicPath: '/static/',
      entry: manifest['src/entry.tsx'],
      moduleIds: [
        'src/pages/home/home.tsx',
        'en-translations',
        'src/pages/missing/missing.tsx',
      ],
    });

    expect(assets.requiredModules).toStrictEqual([
      '/static/assets/home.js',
      '/static/assets/en-translations.js',
    ]);
    expect(assets.modulePreloads).toContain('/static/assets/shared.js');
  });

  it('does not list the client entry as a required module', () => {
    const assets = resolveAssets({
      manifest,
      publicPath: '/',
      entry: manifest['src/entry.tsx'],
      moduleIds: ['src/entry.tsx'],
    });

    expect(assets.requiredModules).toStrictEqual([]);
  });

  it('warns in development for unknown moduleIds', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    resolveAssets({
      manifest,
      publicPath: '/',
      entry: manifest['src/entry.tsx'],
      moduleIds: ['src/pages/missing/missing.tsx'],
      development: true,
    });

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Unknown route handle.moduleId'),
    );
  });

  it('does not warn for unknown moduleIds outside development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    resolveAssets({
      manifest,
      publicPath: '/',
      entry: manifest['src/entry.tsx'],
      moduleIds: ['src/pages/missing/missing.tsx'],
      development: false,
    });

    expect(warn).not.toHaveBeenCalled();
  });
});

describe('findEntryChunk', () => {
  const ssrClient = {
    file: 'ssr-client-ccc.js',
    name: 'ssr-client',
    css: ['assets/client.css'],
  };

  it('picks the ssr-client chunk when other chunks are also isEntry', () => {
    const extraEntriesFirst: ClientManifest = {
      'virtual:other-entry.js': {
        file: 'other-entry-aaa.js',
        name: 'other-entry',
        isEntry: true,
      },
      'packages/sku/dist/entries/ssr-client.mjs': ssrClient,
    };

    expect(findEntryChunk(extraEntriesFirst)).toStrictEqual(ssrClient);
  });

  it('finds ssr-client by manifest key', () => {
    const keyed: ClientManifest = {
      'ssr-client': ssrClient,
    };

    expect(findEntryChunk(keyed)).toStrictEqual(ssrClient);
  });

  it('throws when the ssr-client entry is missing', () => {
    expect(() =>
      findEntryChunk({
        'virtual:other-entry.js': {
          file: 'other-entry-aaa.js',
          name: 'other-entry',
          isEntry: true,
        },
      }),
    ).toThrow('No "ssr-client" entry chunk found');
  });
});

describe('warnUnknownModuleIdsWithoutManifest', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('warns for path-like moduleIds that do not exist on disk', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await using fixture = await createFixture({});

    warnUnknownModuleIdsWithoutManifest(['src/pages/missing/missing.tsx'], {
      cwd: fixture.path,
    });

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(
        'Unknown route handle.moduleId "src/pages/missing/missing.tsx"',
      ),
    );
  });

  it('does not warn for path-like moduleIds that exist on disk', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await using fixture = await createFixture({
      'src/pages/about/about.tsx': '',
    });

    warnUnknownModuleIdsWithoutManifest(['src/pages/about/about.tsx'], {
      cwd: fixture.path,
    });

    expect(warn).not.toHaveBeenCalled();
  });

  it('skips vocab chunk names that are not path-like', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await using fixture = await createFixture({});

    warnUnknownModuleIdsWithoutManifest(['en-translations'], {
      cwd: fixture.path,
    });

    expect(warn).not.toHaveBeenCalled();
  });
});
