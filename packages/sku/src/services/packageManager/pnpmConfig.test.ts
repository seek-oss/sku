import {
  createOrUpdatePnpmConfig,
  detectPnpmConfigFiles,
  getPnpmConfigAction,
} from './pnpmConfig.js';
import { describe, it, vi } from 'vitest';
import { createFixture } from 'fs-fixture';
import { getPnpmConfigValue } from './getPnpmConfigValue.js';

describe('createOrUpdatePnpmConfig', () => {
  it('should create a pnpm-workspace.yaml file when action is "create"', async ({
    expect,
  }) => {
    const logSpy = vi.spyOn(global.console, 'log').mockImplementation(() => {});
    await using fixture = await createFixture({});
    const rootPath = fixture.path;

    await createOrUpdatePnpmConfig({ rootDir: rootPath, action: 'create' });

    expect(logSpy.mock.calls).toMatchInlineSnapshot(`
      [
        [
          "Created pnpm-workspace.yaml. Please run pnpm install.",
        ],
      ]
    `);
    expect(await fixture.readFile('pnpm-workspace.yaml', 'utf-8'))
      .toMatchInlineSnapshot(`
      "publicHoistPattern:
        - eslint
        - prettier
      onlyBuiltDependencies:
        - sku"
    `);
  });

  it('should update an existing pnpm-workspace.yaml file with config when action is "update"', async ({
    expect,
  }) => {
    const logSpy = vi.spyOn(global.console, 'log').mockImplementation(() => {});
    await using fixture = await createFixture({
      ['pnpm-workspace.yaml']: 'existingConfig: true',
    });
    const rootPath = fixture.path;

    await createOrUpdatePnpmConfig({ rootDir: rootPath, action: 'update' });

    expect(logSpy.mock.calls).toMatchInlineSnapshot(`
      [
        [
          "Updated existing pnpm-workspace.yaml. Please run pnpm install.",
        ],
      ]
    `);
    expect(await fixture.readFile('pnpm-workspace.yaml', 'utf-8'))
      .toMatchInlineSnapshot(`
        "existingConfig: true
        publicHoistPattern:
          - eslint
          - prettier
        onlyBuiltDependencies:
          - sku"
      `);
  });

  it('should not update pnpm-workspace.yaml and log a message when action is "log"', async ({
    expect,
  }) => {
    const logSpy = vi.spyOn(global.console, 'log').mockImplementation(() => {});
    await using fixture = await createFixture({
      ['pnpm-workspace.yaml']: 'publicHoistPattern:\n  - foo',
    });
    const rootPath = fixture.path;

    await createOrUpdatePnpmConfig({ rootDir: rootPath, action: 'log' });

    expect(logSpy.mock.calls).toMatchInlineSnapshot(`
      [
        [
          "Potentially conflicting PNPM config detected. Please update your pnpm-workspace.yaml manually with the following config:",
        ],
        [
          "publicHoistPattern:
        - eslint
        - prettier
      onlyBuiltDependencies:
        - sku",
        ],
        [
          "After updating your config, please run pnpm install.",
        ],
      ]
    `);
    expect(await fixture.readFile('pnpm-workspace.yaml', 'utf-8'))
      .toMatchInlineSnapshot(`
        "publicHoistPattern:
          - foo"
      `);
  });

  it('should do nothing when the action is "noop"', async ({ expect }) => {
    const logSpy = vi.spyOn(global.console, 'log').mockImplementation(() => {});
    await using fixture = await createFixture({
      ['pnpm-workspace.yaml']:
        'publicHoistPattern:\n  - eslint\n  - prettier\nonlyBuiltDependencies:\n  - sku',
    });
    const rootPath = fixture.path;

    await createOrUpdatePnpmConfig({ rootDir: rootPath, action: 'noop' });

    expect(logSpy.mock.calls).toMatchInlineSnapshot(`[]`);
    expect(await fixture.readFile('pnpm-workspace.yaml', 'utf-8'))
      .toMatchInlineSnapshot(`
      "publicHoistPattern:
        - eslint
        - prettier
      onlyBuiltDependencies:
        - sku"
    `);
  });
});

describe('detectPnpmConfigFiles', () => {
  it('should warn if there is an .npmrc file', async ({ expect }) => {
    const logSpy = vi.spyOn(global.console, 'log').mockImplementation(() => {});
    await using fixture = await createFixture({
      '.npmrc': 'public-hoist-pattern[]=eslint',
    });

    const result = await detectPnpmConfigFiles(fixture.path);

    expect(logSpy.mock.calls).toMatchInlineSnapshot(`
      [
        [
          "Found '.npmrc' file. It is strongly recommended to migrate all .npmrc configuration to 'pnpm-workspace.yaml' and gitignore '.npmrc'. See https://pnpm.io/settings for more information.",
        ],
      ]
    `);
    expect(result).toStrictEqual({
      npmrcExists: true,
      pnpmWorkspaceFileExists: false,
    });
  });

  it('should not warn if there is no .npmrc file', async ({ expect }) => {
    const logSpy = vi.spyOn(global.console, 'log').mockImplementation(() => {});
    await using fixture = await createFixture({});

    const result = await detectPnpmConfigFiles(fixture.path);

    expect(logSpy.mock.calls).toMatchInlineSnapshot(`[]`);
    expect(result).toStrictEqual({
      npmrcExists: false,
      pnpmWorkspaceFileExists: false,
    });
  });

  it('should detect pnpm workspace file', async ({ expect }) => {
    const logSpy = vi.spyOn(global.console, 'log').mockImplementation(() => {});
    await using fixture = await createFixture({
      'pnpm-workspace.yaml': 'someConfig: true',
    });

    const result = await detectPnpmConfigFiles(fixture.path);

    expect(logSpy.mock.calls).toMatchInlineSnapshot(`[]`);
    expect(result).toStrictEqual({
      npmrcExists: false,
      pnpmWorkspaceFileExists: true,
    });
  });

  it('should detect both files', async ({ expect }) => {
    const logSpy = vi.spyOn(global.console, 'log').mockImplementation(() => {});
    await using fixture = await createFixture({
      'pnpm-workspace.yaml': 'someConfig: true',
      '.npmrc': 'public-hoist-pattern[]=eslint',
    });

    const result = await detectPnpmConfigFiles(fixture.path);

    expect(logSpy.mock.calls).toMatchInlineSnapshot(`
      [
        [
          "Found '.npmrc' file. It is strongly recommended to migrate all .npmrc configuration to 'pnpm-workspace.yaml' and gitignore '.npmrc'. See https://pnpm.io/settings for more information.",
        ],
      ]
    `);
    expect(result).toStrictEqual({
      npmrcExists: true,
      pnpmWorkspaceFileExists: true,
    });
  });
});

describe('getPnpmConfigAction', () => {
  vi.mock('./getPnpmConfigValue.js');

  it.for`
    npmrcExists  | pnpmWorkspaceFileExists | publicHoistPattern               | onlyBuiltDependencies        | action
    ${false}     | ${false}                | ${[]}                          | ${[]}                      | ${'create'}
    ${true}      | ${false}                | ${[]}                          | ${[]}                      | ${'create'}
    ${false}     | ${true}                 | ${[]}                          | ${[]}                      | ${'update'}
    ${true}      | ${true}                 | ${[]}                          | ${[]}                      | ${'update'}
    ${true}      | ${false}                | ${['eslint']}                    | ${[]}                      | ${'log'}
    ${true}      | ${true}                 | ${['eslint']}                    | ${[]}                      | ${'log'}
    ${true}      | ${true}                 | ${['foo']}                       | ${[]}                      | ${'log'}
    ${true}      | ${false}                | ${[]}                          | ${['sku']}                   | ${'log'}
    ${true}      | ${true}                 | ${[]}                          | ${['sku']}                   | ${'log'}
    ${true}      | ${true}                 | ${[]}                          | ${['foo']}                   | ${'log'}
    ${false}     | ${true}                 | ${['eslint', 'prettier', 'foo']} | ${['sku', 'foo']}            | ${'noop'}
    ${true}      | ${true}                 | ${['eslint', 'prettier', 'foo']} | ${['sku', 'foo']}            | ${'noop'}
  `(
    'returns $action when npmrcExists: $npmrcExists, pnpmWorkspaceFileExists: $pnpmWorkspaceFileExists, publicHoistPattern: $publicHoistPattern, onlyBuiltDependencies: $onlyBuiltDependencies ',
    async (
      {
        npmrcExists,
        pnpmWorkspaceFileExists,
        publicHoistPattern,
        onlyBuiltDependencies,
        action,
      },
      { expect },
    ) => {
      vi.mocked(getPnpmConfigValue).mockImplementation((configKey) =>
        Promise.resolve(
          {
            'public-hoist-pattern': publicHoistPattern,
            'only-built-dependencies': onlyBuiltDependencies,
          }[configKey],
        ),
      );

      const result = await getPnpmConfigAction({
        npmrcExists,
        pnpmWorkspaceFileExists,
      });

      expect(result).toBe(action);
    },
  );
});
