import { describe, it, afterEach, vi } from 'vitest';
import { createFixture } from 'fs-fixture';
import { setCwd } from '@sku-private/utils';

import {
  assertPathAliasImports,
  checkPathAliasImports,
  syncPathAliasImports,
} from './pathAliasImports.js';

const originalCwd = process.cwd();

const toPackageJson = (contents: Record<string, unknown>) =>
  `${JSON.stringify(contents, null, 2)}\n`;

describe('syncPathAliasImports', () => {
  afterEach(() => {
    setCwd(originalCwd);
  });

  it('writes the imports field from pathAliases', async ({ expect }) => {
    const fixture = await createFixture({
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
    const fixture = await createFixture({
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
    ).resolves.toEqual({ exitCode: 0 });
  });
});

describe('checkPathAliasImports', () => {
  afterEach(() => {
    setCwd(originalCwd);
    vi.restoreAllMocks();
  });

  it('passes when imports are in sync', async ({ expect }) => {
    const contents = toPackageJson({
      name: 'my-app',
      imports: { '#utils/*': './src/utils/*' },
    });
    await using fixture = await createFixture({ 'package.json': contents });
    setCwd(fixture.path);

    await expect(
      checkPathAliasImports({ '#utils/*': './src/utils/*' }),
    ).resolves.toEqual({ exitCode: 0 });

    expect(await fixture.readFile('package.json', 'utf8')).toBe(contents);
  });

  it('fails when an entry is missing, without writing', async ({ expect }) => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const contents = toPackageJson({ name: 'my-app', private: true });
    await using fixture = await createFixture({ 'package.json': contents });
    setCwd(fixture.path);

    await expect(
      checkPathAliasImports({ '#utils/*': './src/utils/*' }),
    ).resolves.toEqual({ exitCode: 1 });

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('package.json#imports is out of sync'),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('To fix this issue, run'),
    );
    expect(await fixture.readFile('package.json', 'utf8')).toBe(contents);
  });

  it('fails when an entry is stale', async ({ expect }) => {
    const contents = toPackageJson({
      name: 'my-app',
      imports: { '#stale/*': './stale/*' },
    });
    await using fixture = await createFixture({ 'package.json': contents });
    setCwd(fixture.path);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await expect(checkPathAliasImports({})).resolves.toEqual({ exitCode: 1 });

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('package.json#imports is out of sync'),
    );
    expect(await fixture.readFile('package.json', 'utf8')).toBe(contents);
  });

  it('fails when entries are reordered', async ({ expect }) => {
    const contents = toPackageJson({
      name: 'my-app',
      imports: {
        '#utils/*': './src/utils/*',
        '#components/*': './src/components/*',
      },
    });
    await using fixture = await createFixture({ 'package.json': contents });
    setCwd(fixture.path);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await expect(
      checkPathAliasImports({
        '#components/*': './src/components/*',
        '#utils/*': './src/utils/*',
      }),
    ).resolves.toEqual({ exitCode: 1 });

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('package.json#imports is out of sync'),
    );
    expect(await fixture.readFile('package.json', 'utf8')).toBe(contents);
  });

  it('passes when there is no package.json', async ({ expect }) => {
    await using fixture = await createFixture({});
    setCwd(fixture.path);

    await expect(
      checkPathAliasImports({ '#utils/*': './src/utils/*' }),
    ).resolves.toEqual({ exitCode: 0 });
  });
});

describe('assertPathAliasImports', () => {
  afterEach(() => {
    setCwd(originalCwd);
    vi.restoreAllMocks();
  });

  it('exits with a non-zero exit code when out of sync', async ({ expect }) => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);

    const contents = toPackageJson({ name: 'my-app', private: true });
    await using fixture = await createFixture({ 'package.json': contents });
    setCwd(fixture.path);

    await assertPathAliasImports({ '#utils/*': './src/utils/*' });

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('package.json#imports is out of sync'),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('To fix this issue, run'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(await fixture.readFile('package.json', 'utf8')).toBe(contents);
  });

  it('is a no-op when imports are in sync', async ({ expect }) => {
    const contents = toPackageJson({
      name: 'my-app',
      imports: { '#utils/*': './src/utils/*' },
    });
    await using fixture = await createFixture({ 'package.json': contents });
    setCwd(fixture.path);

    await expect(
      assertPathAliasImports({ '#utils/*': './src/utils/*' }),
    ).resolves.toBeUndefined();
  });

  it('is a no-op when there is no package.json', async ({ expect }) => {
    await using fixture = await createFixture({});
    setCwd(fixture.path);

    await expect(
      assertPathAliasImports({ '#utils/*': './src/utils/*' }),
    ).resolves.toBeUndefined();
  });
});
