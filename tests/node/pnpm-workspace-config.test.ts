import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createFixture, scopeToFixture } from '@sku-private/testing-library';

const { sku, fixturePath } = scopeToFixture('configure');

describe('pnpm-workspace-config', () => {
  it('migrates a plugin-era project additively on a regular command, leaving existing values untouched', async () => {
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
        'pnpm-workspace.yaml': `packages:
  - .
configDependencies:
  pnpm-plugin-sku: ^0.0.3
minimumReleaseAge: 1440
allowBuilds:
  '@parcel/watcher': true
`,
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
    expect(content).toContain('blockExoticSubdeps: true # managed by sku');
    expect(content).toContain('trustPolicy: off # managed by sku');
    expect(content).toContain(
      'semver@6.3.1 # dependency of eslint-plugin-react # managed by sku',
    );

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
    expect(content).toContain(
      'minimumReleaseAge: 4320 # 3 days # managed by sku',
    );

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

  it('steady-state silence: produces no warnings or mutations when workspace config is already aligned', async () => {
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
        'pnpm-workspace.yaml': `packages:
  - .
allowBuilds:
  '@parcel/watcher': true # managed by sku
  '@swc/core': true # managed by sku
  core-js-pure: false # managed by sku
  esbuild: true # managed by sku
  sku: true # managed by sku
  unrs-resolver: true # managed by sku
blockExoticSubdeps: true # managed by sku
minimumReleaseAge: 4320 # 3 days # managed by sku
minimumReleaseAgeExclude:
  - '@braid-design-system/*' # managed by sku
  - '@capsizecss/*' # managed by sku
  - '@seek/*' # managed by sku
  - '@sku-lib/*' # managed by sku
  - '@vanilla-extract/*' # managed by sku
  - '@vocab/*' # managed by sku
  - braid-design-system # managed by sku
  - browserslist-config-seek # managed by sku
  - eslint-config-seek # managed by sku
  - sku # managed by sku
publicHoistPattern:
  - eslint # managed by sku
  - prettier # managed by sku
strictDepBuilds: false # managed by sku
trustPolicy: off # managed by sku
trustPolicyExclude:
  - semver@6.3.1 # dependency of eslint-plugin-react # managed by sku
`,
      },
      { tempDir: fixturePath() },
    );

    const relativeCwd = path.relative(fixturePath(), fixture.path);

    const run = await sku('format', [], {
      cwd: relativeCwd,
    });

    await expect(run).toMatchExitCode(0);

    const stdout = run.getStdallStr();
    expect(stdout).not.toContain('pnpm-workspace.yaml:');
    expect(stdout).not.toContain('added ');
    expect(stdout).not.toContain('updated ');
    expect(stdout).not.toContain('removed ');
  });
});
