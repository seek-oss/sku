import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const require = createRequire(
  fileURLToPath(new URL('../../../../package.json', import.meta.url)),
);

const runtimeImportSpecifiers = (source: string) => {
  const specifiers: string[] = [];

  for (const line of source.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('import type ')) {
      continue;
    }

    const match =
      trimmed.match(/^import\s+['"]([^'"]+)['"]/) ??
      trimmed.match(/^import\s+.+\s+from\s+['"]([^'"]+)['"]/) ??
      trimmed.match(/^export\s+.+\s+from\s+['"]([^'"]+)['"]/);

    if (match) {
      specifiers.push(match[1]);
    }
  }

  return specifiers;
};

describe('published entry side-effect import order', () => {
  it.each(['ssr-server', 'ssr-client', 'vite-client', 'vite-render'] as const)(
    '%s imports virtual:sku/entry-side-effects before consumer aliases',
    (entry) => {
      const specifiers = runtimeImportSpecifiers(
        readFileSync(require.resolve(`#entries/${entry}`), 'utf8'),
      );
      const sideEffectsIndex = specifiers.indexOf(
        'virtual:sku/entry-side-effects',
      );

      expect(sideEffectsIndex).toBeGreaterThan(-1);
      expect(
        specifiers.findIndex((specifier) =>
          specifier.startsWith('__sku_alias__'),
        ),
      ).toBeGreaterThan(sideEffectsIndex);

      const polyfillsIndex = specifiers.indexOf('virtual:sku/polyfills');
      expect(polyfillsIndex === -1 || polyfillsIndex > sideEffectsIndex).toBe(
        true,
      );
    },
  );
});
