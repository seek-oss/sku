import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createFixture } from 'fs-fixture';
import { setCwd } from '@sku-private/utils';

import {
  ENTRY_SIDE_EFFECTS_VIRTUAL_ID,
  loadEntrySideEffectsModule,
} from './entrySideEffects.js';

const originalCwd = process.cwd();

describe('loadEntrySideEffectsModule', () => {
  beforeEach(() => {
    setCwd(originalCwd);
  });

  afterEach(() => {
    setCwd(originalCwd);
  });

  it('emits cwd-resolved imports in array order', async () => {
    await using fixture = await createFixture({
      'package.json': '{ "name": "entry-side-effects-fixture" }',
      'side-effects/first.js': 'export {}',
      'side-effects/second.js': 'export {}',
    });
    setCwd(fixture.path);

    const code = loadEntrySideEffectsModule([
      './side-effects/first.js',
      './side-effects/second.js',
    ]);

    expect(code).toContain(fixture.path);
    expect(code.indexOf('first.js')).toBeLessThan(code.indexOf('second.js'));
    expect(code).toMatch(/^import "/);
    expect(code).toMatch(/import ".*first\.js";\nimport ".*second\.js";$/);
  });

  it('keeps bare specifiers so Vite can apply import conditions', async () => {
    await using fixture = await createFixture({
      'package.json': '{ "name": "entry-side-effects-fixture" }',
      'node_modules/dual-pkg/package.json': JSON.stringify({
        name: 'dual-pkg',
        type: 'module',
        exports: {
          '.': {
            import: './esm.js',
            require: './cjs.js',
          },
        },
      }),
      'node_modules/dual-pkg/esm.js': 'export {}',
      'node_modules/dual-pkg/cjs.js': 'module.exports = {}',
    });
    setCwd(fixture.path);

    expect(loadEntrySideEffectsModule(['dual-pkg'])).toBe('import "dual-pkg";');
  });

  it('is a no-op module when the list is empty', () => {
    expect(loadEntrySideEffectsModule([])).toBe('');
  });

  it('throws when a specifier cannot be resolved from cwd', async () => {
    await using fixture = await createFixture({
      'package.json': '{ "name": "entry-side-effects-fixture" }',
    });
    setCwd(fixture.path);

    expect(() =>
      loadEntrySideEffectsModule(['this-package-definitely-does-not-exist']),
    ).toThrow();
  });

  it('exports the virtual module id used by sku entries', () => {
    expect(ENTRY_SIDE_EFFECTS_VIRTUAL_ID).toBe(
      'virtual:sku/entry-side-effects',
    );
  });
});
