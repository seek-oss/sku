import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  resolveAssets,
  warnUnknownModuleIdsWithoutManifest,
  type ClientManifest,
} from './resolveAssets.js';

const manifest: ClientManifest = {
  'src/entry.tsx': {
    file: 'assets/entry.js',
    isEntry: true,
    imports: ['src/pages/about.tsx'],
  },
  'src/pages/about.tsx': {
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
      base: '/assets/',
      entry: manifest['src/entry.tsx'],
      moduleIds: ['src/pages/about.tsx'],
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
      base: '/',
      entry: manifest['src/entry.tsx'],
      moduleIds: ['en-translations'],
    });

    expect(assets.modulePreloads).toContain('/assets/en-translations.js');
  });

  it('warns in development for unknown moduleIds', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    resolveAssets({
      manifest,
      base: '/',
      entry: manifest['src/entry.tsx'],
      moduleIds: ['src/pages/missing.tsx'],
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
      base: '/',
      entry: manifest['src/entry.tsx'],
      moduleIds: ['src/pages/missing.tsx'],
      development: false,
    });

    expect(warn).not.toHaveBeenCalled();
  });
});

describe('warnUnknownModuleIdsWithoutManifest', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('warns for path-like moduleIds that do not exist on disk', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const cwd = mkdtempSync(join(tmpdir(), 'sku-module-id-'));

    warnUnknownModuleIdsWithoutManifest(['src/pages/missing.tsx'], { cwd });

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(
        'Unknown route handle.moduleId "src/pages/missing.tsx"',
      ),
    );
  });

  it('does not warn for path-like moduleIds that exist on disk', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const cwd = mkdtempSync(join(tmpdir(), 'sku-module-id-'));
    mkdirSync(join(cwd, 'src', 'pages'), { recursive: true });
    writeFileSync(join(cwd, 'src', 'pages', 'about.tsx'), '');

    warnUnknownModuleIdsWithoutManifest(['src/pages/about.tsx'], { cwd });

    expect(warn).not.toHaveBeenCalled();
  });

  it('skips vocab chunk names that are not path-like', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const cwd = mkdtempSync(join(tmpdir(), 'sku-module-id-'));

    warnUnknownModuleIdsWithoutManifest(['en-translations'], { cwd });

    expect(warn).not.toHaveBeenCalled();
  });
});
