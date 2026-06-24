import { describe, it, afterEach } from 'vitest';
import { createFixture } from 'fs-fixture';
import { setCwd } from '@sku-private/utils';

import { syncPathAliasImports } from './pathAliasImports.js';

const originalCwd = process.cwd();

describe('syncPathAliasImports', () => {
  afterEach(() => {
    setCwd(originalCwd);
  });

  it('writes the imports field from pathAliases', async ({ expect }) => {
    await using fixture = await createFixture({
      'package.json': `${JSON.stringify(
        { name: 'my-app', private: true },
        null,
        2,
      )}\n`,
    });
    setCwd(fixture.path);

    await syncPathAliasImports({
      '#components/*': './src/components/*',
      '#utils/*': './src/utils/*',
    });

    expect(await fixture.readFile('package.json', 'utf8'))
      .toMatchInlineSnapshot(`
      "{
        "name": "my-app",
        "private": true,
        "imports": {
          "#components/*": "./src/components/*",
          "#utils/*": "./src/utils/*"
        }
      }
      "
    `);
  });

  it('fully replaces an existing imports field', async ({ expect }) => {
    await using fixture = await createFixture({
      'package.json': `${JSON.stringify(
        {
          name: 'my-app',
          imports: { '#stale/*': './stale/*', '#src/*': './src/*' },
        },
        null,
        2,
      )}\n`,
    });
    setCwd(fixture.path);

    await syncPathAliasImports({ '#utils/*': './src/utils/*' });

    const result = JSON.parse(await fixture.readFile('package.json', 'utf8'));
    expect(result.imports).toEqual({ '#utils/*': './src/utils/*' });
  });

  it('removes the imports field when there are no pathAliases', async ({
    expect,
  }) => {
    await using fixture = await createFixture({
      'package.json': `${JSON.stringify(
        { name: 'my-app', imports: { '#utils/*': './src/utils/*' } },
        null,
        2,
      )}\n`,
    });
    setCwd(fixture.path);

    await syncPathAliasImports({});

    const result = JSON.parse(await fixture.readFile('package.json', 'utf8'));
    expect(result).not.toHaveProperty('imports');
  });

  it('leaves package.json untouched when already in sync (idempotent)', async ({
    expect,
  }) => {
    const contents = `${JSON.stringify(
      { name: 'my-app', imports: { '#utils/*': './src/utils/*' } },
      null,
      2,
    )}\n`;
    await using fixture = await createFixture({ 'package.json': contents });
    setCwd(fixture.path);

    await syncPathAliasImports({ '#utils/*': './src/utils/*' });

    expect(await fixture.readFile('package.json', 'utf8')).toBe(contents);
  });

  it('does nothing when there is no package.json', async ({ expect }) => {
    await using fixture = await createFixture({});
    setCwd(fixture.path);

    await expect(
      syncPathAliasImports({ '#utils/*': './src/utils/*' }),
    ).resolves.toBeUndefined();
  });
});
