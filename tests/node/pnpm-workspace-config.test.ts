import { describe, it, expect } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import dedent from 'dedent';
import { createFixture, scopeToFixture } from '@sku-private/testing-library';

const { sku, fixturePath } = scopeToFixture('configure');

describe('pnpm-workspace-config', () => {
  it('lint fails on managed drift, format enforces fixes while preserving unmarked values, and configure does not sync', async () => {
    await using fixture = await createFixture(
      {
        'package.json': JSON.stringify({
          name: 'plugin-migration-test',
          private: true,
          type: 'module',
          skuSkipValidatePeerDeps: true,
        }),
        'sku.config.ts': 'export default {};\n',
        'src/App.tsx': 'export default () => null;\n',
        'pnpm-lock.yaml': 'lockfileVersion: "9.0"\n',
        'pnpm-workspace.yaml': dedent`
          packages:
            - .
          configDependencies:
            pnpm-plugin-sku: ^0.0.3
          minimumReleaseAge: 1440
          allowBuilds:
            '@parcel/watcher': true`,
      },
      { tempDir: fixturePath() },
    );

    const relativeCwd = path.relative(fixturePath(), fixture.path);
    const workspaceYamlPath = path.join(fixture.path, 'pnpm-workspace.yaml');

    // 1. Initial lint fails due to managed drift (plugin presence, missing defaults, pending adoption)
    const lintInitialRun = await sku('lint', [], {
      cwd: relativeCwd,
    });
    await expect(lintInitialRun).toMatchExitCode(1);

    const lintInitialStdout = lintInitialRun.getStdallStr();
    expect(lintInitialStdout).toContain(
      'pnpm-workspace.yaml: "pnpm-plugin-sku" is present in configDependencies.',
    );
    expect(lintInitialStdout).toContain(
      'pnpm-workspace.yaml: "blockExoticSubdeps" is missing, recommended is true.',
    );
    expect(lintInitialStdout).toContain(
      'pnpm-workspace.yaml: "allowBuilds.@parcel/watcher" matches sku\'s default but is missing the "[sku_managed]" marker.',
    );
    expect(lintInitialStdout).toContain('To fix this issue, run');
    // User-managed drift advisory (info-level) is logged
    expect(lintInitialStdout).toContain(
      'pnpm-workspace.yaml: "minimumReleaseAge" has value 1440, recommended is 4320.',
    );

    // 2. sku configure does NOT touch pnpm-workspace.yaml
    const configureRun = await sku('configure', [], {
      cwd: relativeCwd,
    });
    await expect(configureRun).toMatchExitCode(0);

    let content = await readFile(workspaceYamlPath, 'utf-8');
    expect(content).toContain('pnpm-plugin-sku');
    expect(content).not.toContain('blockExoticSubdeps');

    // 3. sku format applies enforcing mutations: removes plugin, adds missing defaults, adopts matching values, preserves unmarked drift
    const formatRun = await sku('format', [], {
      cwd: relativeCwd,
    });
    await expect(formatRun).toMatchExitCode(0);

    content = await readFile(workspaceYamlPath, 'utf-8');
    // configDependencies should be removed
    expect(content).not.toContain('configDependencies');
    expect(content).not.toContain('pnpm-plugin-sku');

    // Unmarked differing value preserved as user-managed
    expect(content).toContain('minimumReleaseAge: 1440');

    // Matching value adopted with marker
    expect(content).toContain("'@parcel/watcher': true # [sku_managed]");

    // Missing defaults added with markers
    expect(content).toContain('blockExoticSubdeps: true # [sku_managed]');
    expect(content).toContain('trustPolicy: off # [sku_managed]');
    expect(content).toContain('semver@6.3.1 # [sku_managed]');

    // 4. Subsequent sku lint now passes (with info logged for user-managed drift)
    const lintSecondRun = await sku('lint', [], {
      cwd: relativeCwd,
    });
    await expect(lintSecondRun).toMatchExitCode(0);

    const lintSecondStdout = lintSecondRun.getStdallStr();
    expect(lintSecondStdout).toContain(
      'pnpm-workspace.yaml: "minimumReleaseAge" has value 1440, recommended is 4320.',
    );
    expect(lintSecondStdout).not.toContain('pnpm-plugin-sku');
    expect(lintSecondStdout).not.toContain('is missing');

    // 5. Subsequent format is silent
    const secondFormatRun = await sku('format', [], {
      cwd: relativeCwd,
    });
    await expect(secondFormatRun).toMatchExitCode(0);

    const secondFormatStdout = secondFormatRun.getStdallStr();
    expect(secondFormatStdout).not.toContain('pnpm-workspace.yaml:');
    expect(secondFormatStdout).not.toContain('added ');
    expect(secondFormatStdout).not.toContain('updated ');
    expect(secondFormatStdout).not.toContain('removed ');
  }, 60000);

  it('produces no warnings or mutations when workspace config is already aligned', async () => {
    await using fixture = await createFixture(
      {
        'package.json': JSON.stringify({
          name: 'aligned-app-test',
          private: true,
          type: 'module',
          skuSkipValidatePeerDeps: true,
        }),
        'sku.config.ts': 'export default {};\n',
        'src/App.tsx': 'export default () => null;\n',
        'pnpm-lock.yaml': 'lockfileVersion: "9.0"\n',
        'pnpm-workspace.yaml': dedent`
          packages:
            - .
          allowBuilds:
            '@parcel/watcher': true # [sku_managed]
            '@swc/core': true # [sku_managed]
            core-js-pure: false # [sku_managed]
            esbuild: true # [sku_managed]
            sku: true # [sku_managed]
            unrs-resolver: true # [sku_managed]
          blockExoticSubdeps: true # [sku_managed]
          minimumReleaseAge: 4320 # 3 days [sku_managed]
          minimumReleaseAgeExclude:
            - '@braid-design-system/*' # [sku_managed]
            - '@capsizecss/*' # [sku_managed]
            - '@seek/*' # [sku_managed]
            - '@sku-lib/*' # [sku_managed]
            - '@vanilla-extract/*' # [sku_managed]
            - '@vocab/*' # [sku_managed]
            - braid-design-system # [sku_managed]
            - browserslist-config-seek # [sku_managed]
            - eslint-config-seek # [sku_managed]
            - sku # [sku_managed]
          publicHoistPattern:
            - eslint # [sku_managed]
            - prettier # [sku_managed]
          strictDepBuilds: false # [sku_managed]
          trustPolicy: off # [sku_managed]
          trustPolicyExclude:
            - semver@6.3.1 # [sku_managed]\n
          `,
      },
      { tempDir: fixturePath() },
    );

    const relativeCwd = path.relative(fixturePath(), fixture.path);
    const workspaceYamlPath = path.join(fixture.path, 'pnpm-workspace.yaml');
    const contentBefore = await readFile(workspaceYamlPath, 'utf-8');

    // Lint is completely silent on aligned config
    const lintRun = await sku('lint', [], {
      cwd: relativeCwd,
    });
    await expect(lintRun).toMatchExitCode(0);
    const lintStdout = lintRun.getStdallStr();
    expect(lintStdout).not.toContain('pnpm-workspace.yaml:');

    // Format is silent on aligned config
    const formatRun = await sku('format', [], {
      cwd: relativeCwd,
    });
    await expect(formatRun).toMatchExitCode(0);

    const formatStdout = formatRun.getStdallStr();
    expect(formatStdout).not.toContain('pnpm-workspace.yaml:');
    expect(formatStdout).not.toContain('added ');
    expect(formatStdout).not.toContain('updated ');
    expect(formatStdout).not.toContain('removed ');

    // Configure does not touch the file
    const configureRun = await sku('configure', [], {
      cwd: relativeCwd,
    });
    await expect(configureRun).toMatchExitCode(0);

    const configureStdout = configureRun.getStdallStr();
    expect(configureStdout).not.toContain('pnpm-workspace.yaml:');
    expect(configureStdout).not.toContain('added ');
    expect(configureStdout).not.toContain('updated ');
    expect(configureStdout).not.toContain('removed ');

    const contentAfter = await readFile(workspaceYamlPath, 'utf-8');
    expect(contentAfter).toBe(contentBefore);
  }, 60000);

  it('lint and format fail when pnpm-workspace.yaml is not a mapping', async () => {
    const original = '- this is not a workspace config map\n';
    await using fixture = await createFixture(
      {
        'package.json': JSON.stringify({
          name: 'invalid-workspace-yaml-test',
          private: true,
          type: 'module',
          skuSkipValidatePeerDeps: true,
        }),
        'sku.config.ts': 'export default {};\n',
        'src/App.tsx': 'export default () => null;\n',
        'pnpm-lock.yaml': 'lockfileVersion: "9.0"\n',
        'pnpm-workspace.yaml': original,
      },
      { tempDir: fixturePath() },
    );

    const relativeCwd = path.relative(fixturePath(), fixture.path);
    const workspaceYamlPath = path.join(fixture.path, 'pnpm-workspace.yaml');

    const lintRun = await sku('lint', [], {
      cwd: relativeCwd,
    });
    await expect(lintRun).toMatchExitCode(1);
    expect(lintRun.getStdallStr()).toContain(
      'pnpm-workspace.yaml must contain a YAML mapping',
    );

    const formatRun = await sku('format', [], {
      cwd: relativeCwd,
    });
    await expect(formatRun).toMatchExitCode(1);
    expect(formatRun.getStdallStr()).toContain(
      'pnpm-workspace.yaml must contain a YAML mapping',
    );
    await expect(formatRun).toMatchExitCode(1);

    expect(await readFile(workspaceYamlPath, 'utf-8')).toBe(original);
  });

  describe('configure workspace', () => {
    it('syncs the workspace root file from a nested package directory, leaving package files untouched', async () => {
      await using fixture = await createFixture(
        {
          'package.json': JSON.stringify({
            name: 'monorepo-root',
            private: true,
            type: 'module',
          }),
          'pnpm-lock.yaml': 'lockfileVersion: "9.0"\n',
          'pnpm-workspace.yaml': dedent`
            packages:
              - 'packages/*'
            minimumReleaseAge: 1440`,
          'packages/app/package.json': JSON.stringify({
            name: 'app',
            private: true,
            type: 'module',
          }),
          'packages/app/src/App.tsx': 'export default () => null;\n',
        },
        { tempDir: fixturePath() },
      );

      const rootWorkspaceYamlPath = path.join(
        fixture.path,
        'pnpm-workspace.yaml',
      );
      const appDir = path.join(fixture.path, 'packages/app');
      const appFilesBefore = await readdir(appDir, { recursive: true });

      // Runs without a sku config file, from a nested package directory
      const packageRun = await sku('configure', ['workspace'], {
        cwd: path.relative(fixturePath(), appDir),
      });
      await expect(packageRun).toMatchExitCode(0);

      const content = await readFile(rootWorkspaceYamlPath, 'utf-8');
      // Missing managed defaults are added to the root file
      expect(content).toContain('blockExoticSubdeps: true # [sku_managed]');
      expect(content).toContain('trustPolicy: off # [sku_managed]');
      // Unmarked differing value is preserved as user-managed
      expect(content).toContain('minimumReleaseAge: 1440');

      // Package directory is untouched: no workspace file, no emitted config
      expect(await readdir(appDir, { recursive: true })).toEqual(
        appFilesBefore,
      );

      // Running from the workspace root works identically (and is silent once aligned)
      const rootRun = await sku('configure', ['workspace'], {
        cwd: path.relative(fixturePath(), fixture.path),
      });
      await expect(rootRun).toMatchExitCode(0);

      const rootStdout = rootRun.getStdallStr();
      expect(rootStdout).not.toContain('added ');
      expect(rootStdout).not.toContain('updated ');
      expect(rootStdout).not.toContain('removed ');
    }, 60000);

    it('creates the workspace root file when missing, while --check fails until it exists', async () => {
      await using fixture = await createFixture(
        {
          'package.json': JSON.stringify({
            name: 'no-workspace-file-test',
            private: true,
            type: 'module',
          }),
          'pnpm-lock.yaml': 'lockfileVersion: "9.0"\n',
        },
        { tempDir: fixturePath() },
      );

      const relativeCwd = path.relative(fixturePath(), fixture.path);
      const workspaceYamlPath = path.join(fixture.path, 'pnpm-workspace.yaml');

      // --check fails when the file is missing, directing to `sku configure workspace`
      const checkRun = await sku('configure', ['workspace', '--check'], {
        cwd: relativeCwd,
      });
      await expect(checkRun).toMatchExitCode(1);

      const checkStdout = checkRun.getStdallStr();
      expect(checkStdout).toContain('No pnpm-workspace.yaml found');
      expect(checkStdout).toContain('sku configure workspace');

      // --check never writes
      expect(existsSync(workspaceYamlPath)).toBe(false);

      // Write mode creates the file with sku's managed settings
      const syncRun = await sku('configure', ['workspace'], {
        cwd: relativeCwd,
      });
      await expect(syncRun).toMatchExitCode(0);
      expect(syncRun.getStdallStr()).toContain('created pnpm-workspace.yaml');

      const content = await readFile(workspaceYamlPath, 'utf-8');
      expect(content).toContain('blockExoticSubdeps: true # [sku_managed]');
      expect(content).toContain(
        'minimumReleaseAge: 4320 # 3 days [sku_managed]',
      );

      // --check passes silently once the file exists and is aligned
      const alignedCheckRun = await sku('configure', ['workspace', '--check'], {
        cwd: relativeCwd,
      });
      await expect(alignedCheckRun).toMatchExitCode(0);
      expect(alignedCheckRun.getStdallStr()).not.toContain(
        'pnpm-workspace.yaml:',
      );
    }, 60000);

    it('no-ops in non-pnpm projects', async () => {
      await using fixture = await createFixture(
        {
          'package.json': JSON.stringify({
            name: 'yarn-project-test',
            private: true,
            type: 'module',
            packageManager: 'yarn@4.5.0',
          }),
          'yarn.lock': '',
        },
        { tempDir: fixturePath() },
      );

      const run = await sku('configure', ['workspace'], {
        cwd: path.relative(fixturePath(), fixture.path),
      });
      await expect(run).toMatchExitCode(0);

      expect(existsSync(path.join(fixture.path, 'pnpm-workspace.yaml'))).toBe(
        false,
      );
    }, 60000);

    it('--check fails on managed drift without writing, and passes silently once aligned', async () => {
      await using fixture = await createFixture(
        {
          'package.json': JSON.stringify({
            name: 'workspace-check-test',
            private: true,
            type: 'module',
          }),
          'pnpm-lock.yaml': 'lockfileVersion: "9.0"\n',
          'pnpm-workspace.yaml': dedent`
            packages:
              - .
            minimumReleaseAge: 1440 # [sku_managed]`,
        },
        { tempDir: fixturePath() },
      );

      const relativeCwd = path.relative(fixturePath(), fixture.path);
      const workspaceYamlPath = path.join(fixture.path, 'pnpm-workspace.yaml');
      const contentBefore = await readFile(workspaceYamlPath, 'utf-8');

      // --check fails on managed drift, directing to `sku configure workspace`
      const checkRun = await sku('configure', ['workspace', '--check'], {
        cwd: relativeCwd,
      });
      await expect(checkRun).toMatchExitCode(1);

      const checkStdout = checkRun.getStdallStr();
      expect(checkStdout).toContain(
        'pnpm-workspace.yaml: "minimumReleaseAge" has value 1440, recommended is 4320.',
      );
      expect(checkStdout).toContain(
        'pnpm-workspace.yaml: "blockExoticSubdeps" is missing, recommended is true.',
      );
      expect(checkStdout).toContain('sku configure workspace');
      expect(checkStdout).not.toContain('sku format');

      // --check never writes
      expect(await readFile(workspaceYamlPath, 'utf-8')).toBe(contentBefore);

      // Write mode enforces the defaults
      const syncRun = await sku('configure', ['workspace'], {
        cwd: relativeCwd,
      });
      await expect(syncRun).toMatchExitCode(0);
      expect(await readFile(workspaceYamlPath, 'utf-8')).toContain(
        'minimumReleaseAge: 4320 # 3 days [sku_managed]',
      );

      // --check passes silently once aligned
      const alignedCheckRun = await sku('configure', ['workspace', '--check'], {
        cwd: relativeCwd,
      });
      await expect(alignedCheckRun).toMatchExitCode(0);
      expect(alignedCheckRun.getStdallStr()).not.toContain(
        'pnpm-workspace.yaml:',
      );
    }, 60000);
  });

  describe('managedWorkspace: false', () => {
    it('skips the lint check and format sync entirely, including plugin migration', async () => {
      const workspaceYaml = dedent`
        packages:
          - .
        configDependencies:
          pnpm-plugin-sku: ^0.0.3
        minimumReleaseAge: 1440\n
      `;
      await using fixture = await createFixture(
        {
          'package.json': JSON.stringify({
            name: 'managed-workspace-opt-out-test',
            private: true,
            type: 'module',
            skuSkipValidatePeerDeps: true,
          }),
          'sku.config.ts': 'export default { managedWorkspace: false };\n',
          'src/App.tsx': 'export default () => null;\n',
          'pnpm-lock.yaml': 'lockfileVersion: "9.0"\n',
          'pnpm-workspace.yaml': workspaceYaml,
        },
        { tempDir: fixturePath() },
      );

      const relativeCwd = path.relative(fixturePath(), fixture.path);
      const workspaceYamlPath = path.join(fixture.path, 'pnpm-workspace.yaml');

      // Lint passes despite managed drift and plugin presence, with no workspace output
      const lintRun = await sku('lint', [], {
        cwd: relativeCwd,
      });
      await expect(lintRun).toMatchExitCode(0);

      const lintStdout = lintRun.getStdallStr();
      expect(lintStdout).not.toContain('pnpm-workspace.yaml');
      expect(lintStdout).not.toContain('pnpm-plugin-sku');

      // Format writes nothing
      const formatRun = await sku('format', [], {
        cwd: relativeCwd,
      });
      await expect(formatRun).toMatchExitCode(0);

      const formatStdout = formatRun.getStdallStr();
      expect(formatStdout).not.toContain('pnpm-workspace.yaml:');
      expect(formatStdout).not.toContain('added ');
      expect(formatStdout).not.toContain('updated ');
      expect(formatStdout).not.toContain('removed ');
      expect(await readFile(workspaceYamlPath, 'utf-8')).toBe(workspaceYaml);
    }, 60000);

    it('does not gate the configure workspace subcommand', async () => {
      await using fixture = await createFixture(
        {
          'package.json': JSON.stringify({
            name: 'managed-workspace-subcommand-test',
            private: true,
            type: 'module',
            skuSkipValidatePeerDeps: true,
          }),
          'sku.config.ts': 'export default { managedWorkspace: false };\n',
          'src/App.tsx': 'export default () => null;\n',
          'pnpm-lock.yaml': 'lockfileVersion: "9.0"\n',
          'pnpm-workspace.yaml': dedent`
            packages:
              - .
            minimumReleaseAge: 1440`,
        },
        { tempDir: fixturePath() },
      );

      const relativeCwd = path.relative(fixturePath(), fixture.path);
      const workspaceYamlPath = path.join(fixture.path, 'pnpm-workspace.yaml');

      const syncRun = await sku('configure', ['workspace'], {
        cwd: relativeCwd,
      });
      await expect(syncRun).toMatchExitCode(0);

      const content = await readFile(workspaceYamlPath, 'utf-8');
      expect(content).toContain('blockExoticSubdeps: true # [sku_managed]');
    }, 60000);
  });
});
