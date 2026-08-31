import { describe, expect, it } from 'vitest';
import type { Manifest } from 'vite';
import { createCollector } from './collector.js';

const manifest = {
  'src/client.tsx': {
    file: 'vite-client.js',
    name: 'vite-client',
    src: 'src/client.tsx',
    isEntry: true,
    imports: ['_shared.js'],
  },
  '_shared.js': {
    file: 'shared.js',
    name: 'shared',
  },
  'src/Async.tsx': {
    file: 'AsyncComponent.js',
    name: 'AsyncComponent',
    src: 'src/Async.tsx',
    isDynamicEntry: true,
    imports: ['_shared.js'],
  },
  '/@vocab/preload/en-translations.js': {
    file: 'en-translations.js',
    name: 'en-translations',
    src: '/@vocab/preload/en-translations.js',
    isEntry: true,
  },
} satisfies Manifest;

describe('Collector script tags', () => {
  it('tags a standalone Vite-entry language chunk and not the client entry', () => {
    const collector = createCollector({ manifest });
    collector.register('en-translations');

    expect(collector.getAllScripts()).toMatchInlineSnapshot(`
      [
        "<script type="module" src="/shared.js"></script>",
        "<script type="module" src="/vite-client.js"></script>",
        "<script type="module" async data-required-chunk src="/en-translations.js"></script>",
      ]
    `);
  });

  it('does not tag recursive imports of a registered module', () => {
    const collector = createCollector({ manifest });
    collector.register('AsyncComponent');

    expect(collector.getAllScripts()).toMatchInlineSnapshot(`
      [
        "<script type="module" src="/shared.js"></script>",
        "<script type="module" src="/vite-client.js"></script>",
        "<script type="module" async data-required-chunk src="/AsyncComponent.js"></script>",
      ]
    `);
  });

  it('does not tag the client entry when it is registered', () => {
    const collector = createCollector({ manifest });
    collector.register('vite-client');

    // Double client entry is expected here
    expect(collector.getAllScripts()).toMatchInlineSnapshot(`
      [
        "<script type="module" src="/shared.js"></script>",
        "<script type="module" src="/vite-client.js"></script>",
        "<script type="module" src="/vite-client.js"></script>",
      ]
    `);
  });

  it('hydrates with no tagged scripts when the manifest is empty', () => {
    const collector = createCollector({});

    expect(collector.getAllScripts()).toEqual([]);
  });
});
