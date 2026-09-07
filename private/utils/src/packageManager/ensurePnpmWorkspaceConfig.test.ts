import dedent from 'dedent';
import { createFixture } from 'fs-fixture';
import { describe, expect, it, vi } from 'vitest';
import { parseDocument } from 'yaml';
import { ensurePnpmWorkspaceConfig } from './ensurePnpmWorkspaceConfig.ts';

const workspaceFile = 'pnpm-workspace.yaml';

describe('ensurePnpmWorkspaceConfig', () => {
  it('leaves missing file untouched when create is false', async () => {
    await using fixture = await createFixture({});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await ensurePnpmWorkspaceConfig({
      targetDir: fixture.path,
      mode: 'additive',
    });
    await ensurePnpmWorkspaceConfig({
      targetDir: fixture.path,
      mode: 'enforce',
    });

    expect(await fixture.exists(workspaceFile)).toBe(false);
    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('does not overwrite a non-map workspace document', async () => {
    const original = '- this is not a workspace config map\n';
    await using fixture = await createFixture({ [workspaceFile]: original });

    await expect(
      ensurePnpmWorkspaceConfig({ targetDir: fixture.path, mode: 'additive' }),
    ).rejects.toThrow('the document must contain a YAML mapping');
    expect(await fixture.readFile(workspaceFile, 'utf8')).toBe(original);
  });

  it('creates file with all default settings and markers when create is true', async () => {
    await using fixture = await createFixture({});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await ensurePnpmWorkspaceConfig({ targetDir: fixture.path, create: true });

    expect(await fixture.exists(workspaceFile)).toBe(true);

    const content = await fixture.readFile(workspaceFile, 'utf8');
    expect(content).toContain('minimumReleaseAge: 4320 # 3 days [sku_managed]');
    expect(content).toContain(
      'semver@6.3.1 # dependency of eslint-plugin-react [sku_managed]',
    );
    expect(content).toContain('blockExoticSubdeps: true # [sku_managed]');
    expect(content).toContain('trustPolicy: off # [sku_managed]');
    expect(content).not.toContain('configDependencies');
    expect(logSpy).toHaveBeenCalledWith('created pnpm-workspace.yaml');

    logSpy.mockRestore();
  });

  it('additive additions: adds missing single-value settings, object setting keys, and array entries with markers', async () => {
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

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await ensurePnpmWorkspaceConfig({
      targetDir: fixture.path,
      mode: 'additive',
    });

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

    logSpy.mockRestore();
  });

  it('existing-value preservation: leaves existing values untouched in additive mode', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: dedent`
        minimumReleaseAge: 1440 # custom setting
        allowBuilds:
          '@swc/core': false # [sku_managed]
      `,
    });

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await ensurePnpmWorkspaceConfig({
      targetDir: fixture.path,
      mode: 'additive',
    });

    const content = await fixture.readFile(workspaceFile, 'utf8');
    expect(content).toContain('minimumReleaseAge: 1440 # custom setting');
    expect(content).toContain("'@swc/core': false");

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'pnpm-workspace.yaml: "minimumReleaseAge" has value 1440, recommended is 4320. Run "sku configure" to align.',
      ),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'pnpm-workspace.yaml: "allowBuilds.@swc/core" has value false, recommended is true. Run "sku configure" to align.',
      ),
    );

    logSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('overwrites in both directions on sku configure (enforce mode)', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: dedent`
        minimumReleaseAge: 1440 # [sku_managed]
        trustPolicy: no-downgrade # [sku_managed]
        allowBuilds:
          '@swc/core': false # [sku_managed]
      `,
    });

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await ensurePnpmWorkspaceConfig({
      targetDir: fixture.path,
      mode: 'enforce',
    });

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

    logSpy.mockRestore();
  });

  it('value-level ownership: preserves an unmarked override of a key sku manages, even in enforce mode', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: dedent`
        allowBuilds:
          '@swc/core': false # custom override
      `,
    });

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await ensurePnpmWorkspaceConfig({
      targetDir: fixture.path,
      mode: 'enforce',
    });

    const content = await fixture.readFile(workspaceFile, 'utf8');
    expect(content).toContain("'@swc/core': false # custom override");
    expect(logSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('updated allowBuilds.@swc/core'),
    );

    logSpy.mockRestore();
  });

  it('entry-level ownership: leaves entries sku does not manage in place in both modes', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: dedent`
        allowBuilds:
          my-custom-package: true
        publicHoistPattern:
          - my-hoisted-dep
      `,
    });

    await ensurePnpmWorkspaceConfig({
      targetDir: fixture.path,
      mode: 'additive',
    });
    let content = await fixture.readFile(workspaceFile, 'utf8');
    expect(content).toContain('my-custom-package: true');
    expect(content).toContain('my-hoisted-dep');

    await ensurePnpmWorkspaceConfig({
      targetDir: fixture.path,
      mode: 'enforce',
    });
    content = await fixture.readFile(workspaceFile, 'utf8');
    expect(content).toContain('my-custom-package: true');
    expect(content).toContain('my-hoisted-dep');
  });

  it('retired-entry removal on sku configure only, and preservation once marker is deleted', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: dedent`
        allowBuilds:
          old-retired-build: true # [sku_managed]
        publicHoistPattern:
          - old-retired-hoist # [sku_managed]
      `,
    });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Additive mode: retained and warns
    await ensurePnpmWorkspaceConfig({
      targetDir: fixture.path,
      mode: 'additive',
    });
    let content = await fixture.readFile(workspaceFile, 'utf8');
    expect(content).toContain('old-retired-build: true # [sku_managed]');
    expect(content).toContain('old-retired-hoist # [sku_managed]');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'pnpm-workspace.yaml: "old-retired-build" in allowBuilds is marked with "[sku_managed]", but is no longer a sku default. Run "sku configure" to remove it, or delete its "[sku_managed]" marker to keep it as a user-managed entry.',
      ),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'pnpm-workspace.yaml: "old-retired-hoist" in publicHoistPattern is marked with "[sku_managed]", but is no longer a sku default. Run "sku configure" to remove it, or delete its "[sku_managed]" marker to keep it as a user-managed entry.',
      ),
    );

    // Now delete the marker from old-retired-hoist so it becomes user-managed
    await fixture.writeFile(
      workspaceFile,
      dedent`
        allowBuilds:
          old-retired-build: true # [sku_managed]
        publicHoistPattern:
          - old-retired-hoist
      `,
    );

    // Enforce mode: old-retired-build removed, but unmarked old-retired-hoist preserved
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await ensurePnpmWorkspaceConfig({
      targetDir: fixture.path,
      mode: 'enforce',
    });

    content = await fixture.readFile(workspaceFile, 'utf8');
    expect(content).not.toContain('old-retired-build');
    expect(content).toContain('old-retired-hoist');
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'removed retired entry allowBuilds.old-retired-build from pnpm-workspace.yaml',
      ),
    );

    warnSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('adoption: unmarked default-matching entries are adopted on every sync', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: dedent`
        minimumReleaseAge: 4320
        allowBuilds:
          '@swc/core': true
        publicHoistPattern:
          - eslint
      `,
    });

    await ensurePnpmWorkspaceConfig({
      targetDir: fixture.path,
      mode: 'additive',
    });

    const content = await fixture.readFile(workspaceFile, 'utf8');
    expect(content).toContain('minimumReleaseAge: 4320 # 3 days [sku_managed]');
    expect(content).toContain("'@swc/core': true # [sku_managed]");
    expect(content).toContain('eslint # [sku_managed]');
  });

  it('re-adoption: deleted marker on a current default is re-adopted on next sync', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: 'blockExoticSubdeps: true\n',
    });

    await ensurePnpmWorkspaceConfig({
      targetDir: fixture.path,
      mode: 'additive',
    });
    let content = await fixture.readFile(workspaceFile, 'utf8');
    expect(content).toContain('blockExoticSubdeps: true # [sku_managed]');

    // User manually deletes the marker
    await fixture.writeFile(
      workspaceFile,
      content.replace('# [sku_managed]', ''),
    );

    // Next sync re-adopts
    await ensurePnpmWorkspaceConfig({
      targetDir: fixture.path,
      mode: 'additive',
    });
    content = await fixture.readFile(workspaceFile, 'utf8');
    expect(content).toContain('blockExoticSubdeps: true # [sku_managed]');
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

    await ensurePnpmWorkspaceConfig({
      targetDir: fixture.path,
      mode: 'enforce',
    });

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

    await ensurePnpmWorkspaceConfig({
      targetDir: fixture.path,
      mode: 'enforce',
    });

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

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await ensurePnpmWorkspaceConfig({
      targetDir: fixture.path,
      mode: 'enforce',
    });

    const content = await fixture.readFile(workspaceFile, 'utf8');
    expect(content).toContain('old-retired-entry # keep this entry');
    expect(content).not.toContain('old-retired-entry # [sku_managed]');
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'removed duplicate old-retired-entry from publicHoistPattern in pnpm-workspace.yaml',
      ),
    );

    logSpy.mockRestore();
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

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await ensurePnpmWorkspaceConfig({
      targetDir: fixture.path,
      mode: 'additive',
    });

    // Asserted as an exact prefix, since where each comment lands matters as
    // much as whether it survives. Sku appends its other defaults below.
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

    logSpy.mockRestore();
  });

  it('aligned-file silence: already aligned file produces no write and no output', async () => {
    await using fixture = await createFixture({});
    await ensurePnpmWorkspaceConfig({ targetDir: fixture.path, create: true });

    const contentBefore = await fixture.readFile(workspaceFile, 'utf8');

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await ensurePnpmWorkspaceConfig({
      targetDir: fixture.path,
      mode: 'additive',
    });
    await ensurePnpmWorkspaceConfig({
      targetDir: fixture.path,
      mode: 'enforce',
    });

    const contentAfter = await fixture.readFile(workspaceFile, 'utf8');
    expect(contentAfter).toBe(contentBefore);

    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('plugin migration: removes pnpm-plugin-sku from configDependencies and cleans up key', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: dedent`
        packages:
          - site
        configDependencies:
          pnpm-plugin-sku: 0.0.3+sha512-test
      `,
    });

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await ensurePnpmWorkspaceConfig({
      targetDir: fixture.path,
      mode: 'additive',
    });

    const content = await fixture.readFile(workspaceFile, 'utf8');
    expect(content).not.toContain('configDependencies');
    expect(content).not.toContain('pnpm-plugin-sku');
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'removed pnpm-plugin-sku from configDependencies in pnpm-workspace.yaml',
      ),
    );

    logSpy.mockRestore();
  });

  it('plugin migration: preserves other plugins in configDependencies', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: dedent`
        configDependencies:
          other-plugin: ^1.0.0
          pnpm-plugin-sku: 0.0.3+sha512-test
      `,
    });

    await ensurePnpmWorkspaceConfig({
      targetDir: fixture.path,
      mode: 'additive',
    });

    const content = await fixture.readFile(workspaceFile, 'utf8');
    expect(content).toContain('configDependencies:');
    expect(content).toContain('other-plugin: ^1.0.0');
    expect(content).not.toContain('pnpm-plugin-sku');
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

    await ensurePnpmWorkspaceConfig({
      targetDir: fixture.path,
      mode: 'additive',
    });

    const content = await fixture.readFile(workspaceFile, 'utf8');
    expect(content).not.toContain('pnpm-plugin-sku');
    expect(content).toContain('other-plugin');
  });

  it('preserves an empty configDependencies key without the sku plugin', async () => {
    await using fixture = await createFixture({
      [workspaceFile]: 'configDependencies: {}\n',
    });

    await ensurePnpmWorkspaceConfig({
      targetDir: fixture.path,
      mode: 'additive',
    });

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

    await ensurePnpmWorkspaceConfig({
      targetDir: fixture.path,
      mode: 'additive',
    });

    const content = await fixture.readFile(workspaceFile, 'utf8');
    const doc = parseDocument(content);
    const items = (doc.toJS() as any).publicHoistPattern;

    expect(items).toEqual(['eslint', 'my-dep', 'prettier']);
  });
});
