import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import dedent from 'dedent';
import { createFixture, scopeToFixture } from '@sku-private/testing-library';

const { sku, fixturePath } = scopeToFixture('configure');

describe('pnpm-workspace-config', () => {
  it('updates a workspace config, leaving existing values untouched', async () => {
    await using fixture = await createFixture(
      {
        'package.json': JSON.stringify({
          name: 'plugin-migration-test',
          private: true,
          type: 'module',
          skuSkipValidatePeerDeps: true,
        }),
        'sku.config.ts': 'export default {};',
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

    const firstRun = await sku('format', [], {
      cwd: relativeCwd,
    });

    await expect(firstRun).toMatchExitCode(0);

    const workspaceYamlPath = path.join(fixture.path, 'pnpm-workspace.yaml');
    let content = await readFile(workspaceYamlPath, 'utf-8');

    // configDependencies should be removed
    expect(content).not.toContain('configDependencies');
    expect(content).not.toContain('pnpm-plugin-sku');

    // Existing values untouched (additive mode)
    expect(content).toContain('minimumReleaseAge: 1440');

    // Missing defaults added with markers
    expect(content).toContain('blockExoticSubdeps: true # [sku_managed]');
    expect(content).toContain('trustPolicy: off # [sku_managed]');
    expect(content).toContain('semver@6.3.1 # [sku_managed]');

    // Drift warning logged
    const firstRunStdout = firstRun.getStdallStr();
    expect(firstRunStdout).toContain(
      'pnpm-workspace.yaml: "minimumReleaseAge" has value 1440, recommended is 4320. Run "sku configure" to align.',
    );

    // sku configure aligns the drifted setting
    const configureRun = await sku('configure', [], {
      cwd: relativeCwd,
    });
    await expect(configureRun).toMatchExitCode(0);

    content = await readFile(workspaceYamlPath, 'utf-8');
    expect(content).toContain('minimumReleaseAge: 4320 # 3 days [sku_managed]');

    // Steady-state silence on subsequent runs
    const secondRun = await sku('format', [], {
      cwd: relativeCwd,
    });
    await expect(secondRun).toMatchExitCode(0);

    const secondRunStdout = secondRun.getStdallStr();
    expect(secondRunStdout).not.toContain('pnpm-workspace.yaml:');
    expect(secondRunStdout).not.toContain('added ');
    expect(secondRunStdout).not.toContain('updated ');
    expect(secondRunStdout).not.toContain('removed ');
  });

  it('produces no warnings or mutations when workspace config is already aligned', async () => {
    await using fixture = await createFixture(
      {
        'package.json': JSON.stringify({
          name: 'aligned-app-test',
          private: true,
          type: 'module',
          skuSkipValidatePeerDeps: true,
        }),
        'sku.config.ts': 'export default {};',
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

    const formatRun = await sku('format', [], {
      cwd: relativeCwd,
    });

    await expect(formatRun).toMatchExitCode(0);

    const formatStdout = formatRun.getStdallStr();
    expect(formatStdout).not.toContain('pnpm-workspace.yaml:');
    expect(formatStdout).not.toContain('added ');
    expect(formatStdout).not.toContain('updated ');
    expect(formatStdout).not.toContain('removed ');

    // Enforce mode (sku configure) on an already-aligned file is just as silent
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
  });
});
