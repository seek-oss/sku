import dedent from 'dedent';
import { createFixture } from 'fs-fixture';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type MockInstance,
  vi,
} from 'vitest';
import { parseDocument } from 'yaml';
import {
  checkPnpmWorkspaceConfig,
  ensurePnpmWorkspaceConfig,
} from './ensurePnpmWorkspaceConfig.ts';

const workspaceFile = 'pnpm-workspace.yaml';

describe('checkPnpmWorkspaceConfig', () => {
  it('returns silent success when file is missing', async () => {
    await using fixture = await createFixture({});
    const result = await checkPnpmWorkspaceConfig({ targetDir: fixture.path });

    expect(result).toEqual({
      hasFailure: false,
      failures: [],
      advisories: [],
    });
  });

  it('returns silent success when workspace config is already aligned', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: dedent`
        packages:
          - site
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
          - semver@6.3.1 # [sku_managed]
      `,
    });

    const result = await checkPnpmWorkspaceConfig({ targetDir: fixture.path });

    expect(result).toEqual({
      hasFailure: false,
      failures: [],
      advisories: [],
    });
  });

  it('fails when managed settings or entries are missing', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: dedent`
        packages:
          - site
      `,
    });

    const result = await checkPnpmWorkspaceConfig({ targetDir: fixture.path });

    expect(result.hasFailure).toBe(true);
    expect(result.failures).toContain(
      'pnpm-workspace.yaml: "minimumReleaseAge" is missing, recommended is 4320.',
    );
    expect(result.failures).toContain(
      'pnpm-workspace.yaml: "allowBuilds" is missing.',
    );
    expect(result.failures).toContain(
      'pnpm-workspace.yaml: "publicHoistPattern" is missing.',
    );
  });

  it('fails when a marked value differs from default', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: dedent`
        minimumReleaseAge: 1440 # [sku_managed]
        trustPolicy: no-downgrade # [sku_managed]
        allowBuilds:
          '@swc/core': false # [sku_managed]
      `,
    });

    const result = await checkPnpmWorkspaceConfig({ targetDir: fixture.path });

    expect(result.hasFailure).toBe(true);
    expect(result.failures).toContain(
      'pnpm-workspace.yaml: "minimumReleaseAge" has value 1440, recommended is 4320.',
    );
    expect(result.failures).toContain(
      'pnpm-workspace.yaml: "trustPolicy" has value no-downgrade, recommended is off.',
    );
    expect(result.failures).toContain(
      'pnpm-workspace.yaml: "allowBuilds.@swc/core" has value false, recommended is true.',
    );
  });

  it('fails when an unmarked value matches a default (pending adoption)', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: dedent`
        minimumReleaseAge: 4320
        allowBuilds:
          '@swc/core': true
        publicHoistPattern:
          - eslint
      `,
    });

    const result = await checkPnpmWorkspaceConfig({ targetDir: fixture.path });

    expect(result.hasFailure).toBe(true);
    expect(result.failures).toContain(
      'pnpm-workspace.yaml: "minimumReleaseAge" matches sku\'s default but is missing the "[sku_managed]" marker.',
    );
    expect(result.failures).toContain(
      'pnpm-workspace.yaml: "allowBuilds.@swc/core" matches sku\'s default but is missing the "[sku_managed]" marker.',
    );
    expect(result.failures).toContain(
      'pnpm-workspace.yaml: "eslint" in publicHoistPattern matches sku\'s default but is missing the "[sku_managed]" marker.',
    );
  });

  it('fails when a marked entry is retired', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: dedent`
        allowBuilds:
          old-retired-build: true # [sku_managed]
        publicHoistPattern:
          - old-retired-hoist # [sku_managed]
      `,
    });

    const result = await checkPnpmWorkspaceConfig({ targetDir: fixture.path });

    expect(result.hasFailure).toBe(true);
    expect(result.failures).toContain(
      'pnpm-workspace.yaml: "old-retired-build" in allowBuilds is marked with "[sku_managed]", but is no longer a sku default. Delete its "[sku_managed]" marker to keep it as a user-managed entry.',
    );
    expect(result.failures).toContain(
      'pnpm-workspace.yaml: "old-retired-hoist" in publicHoistPattern is marked with "[sku_managed]", but is no longer a sku default. Delete its "[sku_managed]" marker to keep it as a user-managed entry.',
    );
  });

  it('fails when pnpm-plugin-sku is present in configDependencies', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: dedent`
        configDependencies:
          pnpm-plugin-sku: ^0.0.3
      `,
    });

    const result = await checkPnpmWorkspaceConfig({ targetDir: fixture.path });

    expect(result.hasFailure).toBe(true);
    expect(result.failures).toContain(
      'pnpm-workspace.yaml: "pnpm-plugin-sku" is present in configDependencies.',
    );
  });

  it('logs user-managed drift as info and does not fail', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: dedent`
        minimumReleaseAge: 1440 # user customized
        trustPolicy: no-downgrade # user customized
        allowBuilds:
          '@swc/core': false # user customized
          '@parcel/watcher': true # [sku_managed]
          core-js-pure: false # [sku_managed]
          esbuild: true # [sku_managed]
          sku: true # [sku_managed]
          unrs-resolver: true # [sku_managed]
        blockExoticSubdeps: true # [sku_managed]
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
        trustPolicyExclude:
          - semver@6.3.1 # [sku_managed]
      `,
    });

    const result = await checkPnpmWorkspaceConfig({ targetDir: fixture.path });

    expect(result.hasFailure).toBe(false);
    expect(result.failures).toEqual([]);
    expect(result.advisories).toContain(
      'pnpm-workspace.yaml: "minimumReleaseAge" has value 1440, recommended is 4320. To re-align, edit the value to match sku\'s default, or delete it and run "sku format" to re-add it as sku-managed.',
    );
    expect(result.advisories).toContain(
      'pnpm-workspace.yaml: "trustPolicy" has value no-downgrade, recommended is off. To re-align, edit the value to match sku\'s default, or delete it and run "sku format" to re-add it as sku-managed.',
    );
    expect(result.advisories).toContain(
      'pnpm-workspace.yaml: "allowBuilds.@swc/core" has value false, recommended is true. To re-align, edit the value to match sku\'s default, or delete it and run "sku format" to re-add it as sku-managed.',
    );
  });

  it('stays silent for user-owned custom entries with no corresponding sku default', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: dedent`
        allowBuilds:
          custom-pkg: true
        publicHoistPattern:
          - my-custom-dep
      `,
    });

    const result = await checkPnpmWorkspaceConfig({ targetDir: fixture.path });

    expect(result.advisories).not.toContain(
      expect.stringContaining('custom-pkg'),
    );
    expect(result.advisories).not.toContain(
      expect.stringContaining('my-custom-dep'),
    );
  });

  it('throws when the workspace document is not a mapping', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: '- this is not a workspace config map\n',
    });

    await expect(
      checkPnpmWorkspaceConfig({ targetDir: fixture.path }),
    ).rejects.toThrow('the document must contain a YAML mapping');
  });

  it('throws when the workspace document has YAML parse errors', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: 'packages: [\n',
    });

    await expect(
      checkPnpmWorkspaceConfig({ targetDir: fixture.path }),
    ).rejects.toThrow(/Cannot check /);
  });
});

describe('ensurePnpmWorkspaceConfig', () => {
  let logSpy: MockInstance<typeof console.log>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('leaves missing file untouched when create is false', async () => {
    await using fixture = await createFixture({});
    await ensurePnpmWorkspaceConfig({ targetDir: fixture.path });

    expect(await fixture.exists(workspaceFile)).toBe(false);
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('does not overwrite a non-map workspace document', async () => {
    const original = '- this is not a workspace config map\n';
    await using fixture = await createFixture({ [workspaceFile]: original });

    await expect(
      ensurePnpmWorkspaceConfig({ targetDir: fixture.path }),
    ).rejects.toThrow('the document must contain a YAML mapping');
    expect(await fixture.readFile(workspaceFile, 'utf8')).toBe(original);
  });

  it('does not overwrite a document with YAML parse errors', async () => {
    const original = 'packages: [\n';
    await using fixture = await createFixture({ [workspaceFile]: original });

    await expect(
      ensurePnpmWorkspaceConfig({ targetDir: fixture.path }),
    ).rejects.toThrow(/Cannot sync /);
    expect(await fixture.readFile(workspaceFile, 'utf8')).toBe(original);
  });

  it('creates file with all default settings and markers when create is true', async () => {
    await using fixture = await createFixture({});
    await ensurePnpmWorkspaceConfig({ targetDir: fixture.path, create: true });

    expect(await fixture.exists(workspaceFile)).toBe(true);

    const content = await fixture.readFile(workspaceFile, 'utf8');
    expect(content).toContain('minimumReleaseAge: 4320 # 3 days [sku_managed]');
    expect(content).toContain('semver@6.3.1 # [sku_managed]');
    expect(content).toContain('blockExoticSubdeps: true # [sku_managed]');
    expect(content).toContain('trustPolicy: off # [sku_managed]');
    expect(content).not.toContain('configDependencies');
    expect(logSpy).toHaveBeenCalledWith('created pnpm-workspace.yaml');
  });

  it('adds missing settings, object keys, and array entries with markers', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: dedent`
        packages:
          - site
        allowBuilds:
          '@swc/core': true # [sku_managed]
        publicHoistPattern:
          - eslint # [sku_managed]
      `,
    });

    await ensurePnpmWorkspaceConfig({ targetDir: fixture.path });

    const content = await fixture.readFile(workspaceFile, 'utf8');
    expect(content).toContain('packages:');
    expect(content).toContain('minimumReleaseAge: 4320 # 3 days [sku_managed]');
    expect(content).toContain('blockExoticSubdeps: true # [sku_managed]');
    expect(content).toContain('"@parcel/watcher": true # [sku_managed]');
    expect(content).toContain('prettier # [sku_managed]');

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'added minimumReleaseAge: 4320 to pnpm-workspace.yaml',
      ),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'added prettier to publicHoistPattern in pnpm-workspace.yaml',
      ),
    );
  });

  it('overwrites marked values in both directions', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: dedent`
        minimumReleaseAge: 1440 # [sku_managed]
        trustPolicy: no-downgrade # [sku_managed]
        allowBuilds:
          '@swc/core': false # [sku_managed]
      `,
    });

    await ensurePnpmWorkspaceConfig({ targetDir: fixture.path });

    const content = await fixture.readFile(workspaceFile, 'utf8');
    expect(content).toContain('minimumReleaseAge: 4320 # 3 days [sku_managed]');
    expect(content).toContain('trustPolicy: off # [sku_managed]');
    expect(content).toContain("'@swc/core': true # [sku_managed]");

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'updated minimumReleaseAge: 1440 → 4320 in pnpm-workspace.yaml',
      ),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'updated trustPolicy: no-downgrade → off in pnpm-workspace.yaml',
      ),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'updated allowBuilds.@swc/core: false → true in pnpm-workspace.yaml',
      ),
    );
  });

  it('uniform ownership: preserves unmarked single-value and object overrides', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: dedent`
        minimumReleaseAge: 1440 # custom override
        trustPolicy: no-downgrade # custom override
        allowBuilds:
          '@swc/core': false # custom override
      `,
    });

    await ensurePnpmWorkspaceConfig({ targetDir: fixture.path });

    const content = await fixture.readFile(workspaceFile, 'utf8');
    expect(content).toContain('minimumReleaseAge: 1440 # custom override');
    expect(content).toContain('trustPolicy: no-downgrade # custom override');
    expect(content).toContain("'@swc/core': false # custom override");
    expect(logSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('updated minimumReleaseAge'),
    );
    expect(logSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('updated trustPolicy'),
    );
    expect(logSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('updated allowBuilds.@swc/core'),
    );
  });

  it('entry-level ownership: leaves entries sku does not manage in place', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: dedent`
        allowBuilds:
          my-custom-package: true
        publicHoistPattern:
          - my-hoisted-dep
      `,
    });

    await ensurePnpmWorkspaceConfig({ targetDir: fixture.path });

    const content = await fixture.readFile(workspaceFile, 'utf8');
    expect(content).toContain('my-custom-package: true');
    expect(content).toContain('my-hoisted-dep');
  });

  it('removes retired marked entries and preserves unmarked retired entries', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: dedent`
        allowBuilds:
          old-retired-build: true # [sku_managed]
        publicHoistPattern:
          - old-retired-hoist
      `,
    });

    await ensurePnpmWorkspaceConfig({ targetDir: fixture.path });

    const content = await fixture.readFile(workspaceFile, 'utf8');
    expect(content).not.toContain('old-retired-build');
    expect(content).toContain('old-retired-hoist');
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'removed retired entry allowBuilds.old-retired-build from pnpm-workspace.yaml',
      ),
    );
  });

  it('adoption: unmarked default-matching entries are adopted on sync', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: dedent`
        minimumReleaseAge: 4320
        allowBuilds:
          '@swc/core': true
        publicHoistPattern:
          - eslint
      `,
    });

    await ensurePnpmWorkspaceConfig({ targetDir: fixture.path });

    const content = await fixture.readFile(workspaceFile, 'utf8');
    expect(content).toContain('minimumReleaseAge: 4320 # 3 days [sku_managed]');
    expect(content).toContain("'@swc/core': true # [sku_managed]");
    expect(content).toContain('eslint # [sku_managed]');
  });

  it('only treats the bracketed marker as sku ownership', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: dedent`
        allowBuilds:
          old-retired-build: true # not sku_managed
        publicHoistPattern:
          - old-retired-hoist # not sku_managed
      `,
    });

    await ensurePnpmWorkspaceConfig({ targetDir: fixture.path });

    const content = await fixture.readFile(workspaceFile, 'utf8');
    expect(content).toContain('old-retired-build: true # not sku_managed');
    expect(content).toContain('old-retired-hoist # not sku_managed');
  });

  it('recognises the marker anywhere in a comment', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: dedent`
        allowBuilds:
          old-retired-build: true # [sku_managed] added in v14
        publicHoistPattern:
          - old-retired-hoist # [sku_managed] added in v14
      `,
    });

    await ensurePnpmWorkspaceConfig({ targetDir: fixture.path });

    const content = await fixture.readFile(workspaceFile, 'utf8');
    expect(content).not.toContain('old-retired-build');
    expect(content).not.toContain('old-retired-hoist');
  });

  it('preserves an unmarked duplicate over a marked retired entry', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: dedent`
        publicHoistPattern:
          - old-retired-entry # [sku_managed]
          - old-retired-entry # keep this entry
      `,
    });

    await ensurePnpmWorkspaceConfig({ targetDir: fixture.path });

    const content = await fixture.readFile(workspaceFile, 'utf8');
    expect(content).toContain('old-retired-entry # keep this entry');
    expect(content).not.toContain('old-retired-entry # [sku_managed]');
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'removed duplicate old-retired-entry from publicHoistPattern in pnpm-workspace.yaml',
      ),
    );
  });

  it('replaces comments on adopted managed entries', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: dedent`
        # Top level workspace comment
        packages:
          - site # comment on packages
        # comment before minimumReleaseAge
        minimumReleaseAge: 4320 # critical for security
        allowBuilds:
          # comment before allowBuilds entry
          '@parcel/watcher':
            # comment before value
            true
      `,
    });

    await ensurePnpmWorkspaceConfig({ targetDir: fixture.path });

    const expectedHead = dedent`
      # Top level workspace comment
      packages:
        - site # comment on packages
      minimumReleaseAge: 4320 # 3 days [sku_managed]
      allowBuilds:
        # comment before allowBuilds entry
        '@parcel/watcher': true # [sku_managed]
    `;

    const content = await fixture.readFile(workspaceFile, 'utf8');
    expect(content.slice(0, expectedHead.length)).toBe(expectedHead);
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'adopted minimumReleaseAge: 4320 in pnpm-workspace.yaml',
      ),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'adopted allowBuilds.@parcel/watcher: true in pnpm-workspace.yaml',
      ),
    );
  });

  it('plugin migration: preserves other plugins in configDependencies', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: dedent`
        configDependencies:
          other-plugin: ^1.0.0
          pnpm-plugin-sku: 0.0.3+sha512-test
      `,
    });

    await ensurePnpmWorkspaceConfig({ targetDir: fixture.path });

    const content = await fixture.readFile(workspaceFile, 'utf8');
    expect(content).toContain('configDependencies:');
    expect(content).toContain('other-plugin: ^1.0.0');
    expect(content).not.toContain('pnpm-plugin-sku');
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'removed pnpm-plugin-sku from configDependencies in pnpm-workspace.yaml',
      ),
    );
  });

  it('plugin migration: removes every duplicate sequence entry', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: dedent`
        configDependencies:
          - pnpm-plugin-sku
          - other-plugin
          - pnpm-plugin-sku
      `,
    });

    await ensurePnpmWorkspaceConfig({ targetDir: fixture.path });

    const content = await fixture.readFile(workspaceFile, 'utf8');
    expect(content).not.toContain('pnpm-plugin-sku');
    expect(content).toContain('other-plugin');
  });

  it('preserves an empty configDependencies key without the sku plugin', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: 'configDependencies: {}\n',
    });

    await ensurePnpmWorkspaceConfig({ targetDir: fixture.path });

    const content = await fixture.readFile(workspaceFile, 'utf8');
    expect(content).toContain('configDependencies: {}');
  });

  it('unions and dedupes array settings', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: dedent`
        publicHoistPattern:
          - eslint
          - eslint
          - my-dep
      `,
    });

    await ensurePnpmWorkspaceConfig({ targetDir: fixture.path });

    const content = await fixture.readFile(workspaceFile, 'utf8');
    const doc = parseDocument(content);
    const items = (doc.toJS() as any).publicHoistPattern;

    expect(items).toEqual(['eslint', 'my-dep', 'prettier']);
  });
});
