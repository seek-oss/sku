import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { parseDocument } from 'yaml';
import { ensurePnpmWorkspaceConfig } from './ensurePnpmWorkspaceConfig.ts';

const withTempDir = async (fn: (dir: string) => Promise<void>) => {
  const dir = await mkdtemp(join(tmpdir(), 'sku-pnpm-workspace-test-'));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
};

describe('ensurePnpmWorkspaceConfig', () => {
  it('leaves missing file untouched when create is false', async () => {
    await withTempDir(async (dir) => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await ensurePnpmWorkspaceConfig({ targetDir: dir, mode: 'additive' });
      await ensurePnpmWorkspaceConfig({ targetDir: dir, mode: 'enforce' });

      expect(existsSync(join(dir, 'pnpm-workspace.yaml'))).toBe(false);
      expect(logSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();

      logSpy.mockRestore();
      warnSpy.mockRestore();
    });
  });

  it('creates file with all default settings and markers when create is true', async () => {
    await withTempDir(async (dir) => {
      await ensurePnpmWorkspaceConfig({ targetDir: dir, create: true });

      const filePath = join(dir, 'pnpm-workspace.yaml');
      expect(existsSync(filePath)).toBe(true);

      const content = await readFile(filePath, 'utf-8');
      expect(content).toContain(
        'minimumReleaseAge: 4320 # 3 days # managed by sku',
      );
      expect(content).toContain(
        'semver@6.3.1 # dependency of eslint-plugin-react # managed by sku',
      );
      expect(content).toContain('blockExoticSubdeps: true # managed by sku');
      expect(content).toContain('trustPolicy: off # managed by sku');
      expect(content).not.toContain('configDependencies');
    });
  });

  it('additive additions: adds missing managed single-value, allowBuilds keys, and array entries with markers', async () => {
    await withTempDir(async (dir) => {
      const filePath = join(dir, 'pnpm-workspace.yaml');
      await writeFile(
        filePath,
        `
packages:
  - site
allowBuilds:
  '@swc/core': true # managed by sku
publicHoistPattern:
  - eslint # managed by sku
`,
        'utf-8',
      );

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await ensurePnpmWorkspaceConfig({ targetDir: dir, mode: 'additive' });

      const content = await readFile(filePath, 'utf-8');
      expect(content).toContain('packages:');
      expect(content).toContain(
        'minimumReleaseAge: 4320 # 3 days # managed by sku',
      );
      expect(content).toContain('blockExoticSubdeps: true # managed by sku');
      expect(content).toMatch(
        /['"]@parcel\/watcher['"]:\s*true # managed by sku/,
      );
      expect(content).toContain('prettier # managed by sku');

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
  });

  it('existing-value preservation: leaves existing values untouched in additive mode', async () => {
    await withTempDir(async (dir) => {
      const filePath = join(dir, 'pnpm-workspace.yaml');
      await writeFile(
        filePath,
        `
minimumReleaseAge: 1440 # custom setting
allowBuilds:
  '@swc/core': false
`,
        'utf-8',
      );

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await ensurePnpmWorkspaceConfig({ targetDir: dir, mode: 'additive' });

      const content = await readFile(filePath, 'utf-8');
      expect(content).toContain('minimumReleaseAge: 1440 # custom setting');
      expect(content).toMatch(/['"]@swc\/core['"]:\s*false/);

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
  });

  it('overwrites in both directions on sku configure (enforce mode)', async () => {
    await withTempDir(async (dir) => {
      const filePath = join(dir, 'pnpm-workspace.yaml');
      await writeFile(
        filePath,
        `
minimumReleaseAge: 1440 # managed by sku
trustPolicy: no-downgrade # managed by sku
allowBuilds:
  '@swc/core': false # managed by sku
`,
        'utf-8',
      );

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await ensurePnpmWorkspaceConfig({ targetDir: dir, mode: 'enforce' });

      const content = await readFile(filePath, 'utf-8');
      expect(content).toContain(
        'minimumReleaseAge: 4320 # 3 days # managed by sku',
      );
      expect(content).toContain('trustPolicy: off # managed by sku');
      expect(content).toMatch(/['"]@swc\/core['"]:\s*true # managed by sku/);

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
  });

  it('user-entry preservation: leaves user-added entries in place in both modes', async () => {
    await withTempDir(async (dir) => {
      const filePath = join(dir, 'pnpm-workspace.yaml');
      await writeFile(
        filePath,
        `
allowBuilds:
  my-custom-package: true
publicHoistPattern:
  - my-hoisted-dep
`,
        'utf-8',
      );

      await ensurePnpmWorkspaceConfig({ targetDir: dir, mode: 'additive' });
      let content = await readFile(filePath, 'utf-8');
      expect(content).toContain('my-custom-package: true');
      expect(content).toContain('my-hoisted-dep');

      await ensurePnpmWorkspaceConfig({ targetDir: dir, mode: 'enforce' });
      content = await readFile(filePath, 'utf-8');
      expect(content).toContain('my-custom-package: true');
      expect(content).toContain('my-hoisted-dep');
    });
  });

  it('retired-entry removal on sku configure only, and preservation once marker is deleted', async () => {
    await withTempDir(async (dir) => {
      const filePath = join(dir, 'pnpm-workspace.yaml');
      await writeFile(
        filePath,
        `
allowBuilds:
  old-retired-build: true # managed by sku
publicHoistPattern:
  - old-retired-hoist # managed by sku
`,
        'utf-8',
      );

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Additive mode: retained and warns
      await ensurePnpmWorkspaceConfig({ targetDir: dir, mode: 'additive' });
      let content = await readFile(filePath, 'utf-8');
      expect(content).toContain('old-retired-build: true # managed by sku');
      expect(content).toContain('old-retired-hoist # managed by sku');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'pnpm-workspace.yaml: "old-retired-build" in allowBuilds is marked as managed by sku, but is no longer a sku default. Run "sku configure" to remove it, or delete its "# managed by sku" marker to keep it as a user-managed entry.',
        ),
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'pnpm-workspace.yaml: "old-retired-hoist" in publicHoistPattern is marked as managed by sku, but is no longer a sku default. Run "sku configure" to remove it, or delete its "# managed by sku" marker to keep it as a user-managed entry.',
        ),
      );

      // Now delete the marker from old-retired-hoist so it becomes user-managed
      await writeFile(
        filePath,
        `
allowBuilds:
  old-retired-build: true # managed by sku
publicHoistPattern:
  - old-retired-hoist
`,
        'utf-8',
      );

      // Enforce mode: old-retired-build removed, but unmarked old-retired-hoist preserved
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await ensurePnpmWorkspaceConfig({ targetDir: dir, mode: 'enforce' });

      content = await readFile(filePath, 'utf-8');
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
  });

  it('adoption: unmarked default-matching entries are adopted on every sync', async () => {
    await withTempDir(async (dir) => {
      const filePath = join(dir, 'pnpm-workspace.yaml');
      await writeFile(
        filePath,
        `
minimumReleaseAge: 4320
allowBuilds:
  '@swc/core': true
publicHoistPattern:
  - eslint
`,
        'utf-8',
      );

      await ensurePnpmWorkspaceConfig({ targetDir: dir, mode: 'additive' });

      const content = await readFile(filePath, 'utf-8');
      expect(content).toContain(
        'minimumReleaseAge: 4320 # 3 days # managed by sku',
      );
      expect(content).toMatch(/['"]@swc\/core['"]:\s*true # managed by sku/);
      expect(content).toContain('eslint # managed by sku');
    });
  });

  it('re-adoption: deleted marker on a current default is re-adopted on next sync', async () => {
    await withTempDir(async (dir) => {
      const filePath = join(dir, 'pnpm-workspace.yaml');
      await writeFile(
        filePath,
        `
blockExoticSubdeps: true
`,
        'utf-8',
      );

      await ensurePnpmWorkspaceConfig({ targetDir: dir, mode: 'additive' });
      let content = await readFile(filePath, 'utf-8');
      expect(content).toContain('blockExoticSubdeps: true # managed by sku');

      // User manually deletes the marker
      await writeFile(
        filePath,
        content.replace('# managed by sku', ''),
        'utf-8',
      );

      // Next sync re-adopts
      await ensurePnpmWorkspaceConfig({ targetDir: dir, mode: 'additive' });
      content = await readFile(filePath, 'utf-8');
      expect(content).toContain('blockExoticSubdeps: true # managed by sku');
    });
  });

  it('re-added retired entry is preserved', async () => {
    await withTempDir(async (dir) => {
      const filePath = join(dir, 'pnpm-workspace.yaml');
      // User re-adds an entry that was once a default, without a marker
      await writeFile(
        filePath,
        `
publicHoistPattern:
  - old-retired-entry
`,
        'utf-8',
      );

      await ensurePnpmWorkspaceConfig({ targetDir: dir, mode: 'enforce' });

      const content = await readFile(filePath, 'utf-8');
      expect(content).toContain('old-retired-entry');
      expect(content).not.toContain('old-retired-entry # managed by sku');
    });
  });

  it('comment preservation: user comments are preserved and entries with user comments are not marked', async () => {
    await withTempDir(async (dir) => {
      const filePath = join(dir, 'pnpm-workspace.yaml');
      await writeFile(
        filePath,
        `
# Top level workspace comment
packages:
  - site # comment on packages
minimumReleaseAge: 4320 # critical for security
allowBuilds:
  '@parcel/watcher': true # keep this fast
`,
        'utf-8',
      );

      await ensurePnpmWorkspaceConfig({ targetDir: dir, mode: 'additive' });

      const content = await readFile(filePath, 'utf-8');
      expect(content).toContain('# Top level workspace comment');
      expect(content).toContain('packages:');
      expect(content).toContain('# comment on packages');
      expect(content).toContain(
        'minimumReleaseAge: 4320 # critical for security',
      );
      expect(content).toMatch(
        /['"]@parcel\/watcher['"]:\s*true # keep this fast/,
      );
      expect(content).not.toContain('# critical for security # managed by sku');
      expect(content).not.toContain('# keep this fast # managed by sku');
    });
  });

  it('aligned-file silence: already aligned file produces no write and no output', async () => {
    await withTempDir(async (dir) => {
      await ensurePnpmWorkspaceConfig({ targetDir: dir, create: true });

      const filePath = join(dir, 'pnpm-workspace.yaml');
      const contentBefore = await readFile(filePath, 'utf-8');

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await ensurePnpmWorkspaceConfig({ targetDir: dir, mode: 'additive' });
      await ensurePnpmWorkspaceConfig({ targetDir: dir, mode: 'enforce' });

      const contentAfter = await readFile(filePath, 'utf-8');
      expect(contentAfter).toBe(contentBefore);

      expect(logSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();

      logSpy.mockRestore();
      warnSpy.mockRestore();
    });
  });

  it('plugin migration: removes pnpm-plugin-sku from configDependencies and cleans up key', async () => {
    await withTempDir(async (dir) => {
      const filePath = join(dir, 'pnpm-workspace.yaml');
      await writeFile(
        filePath,
        `
packages:
  - site
configDependencies:
  pnpm-plugin-sku: 0.0.3+sha512-test
`,
        'utf-8',
      );

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await ensurePnpmWorkspaceConfig({ targetDir: dir, mode: 'additive' });

      const content = await readFile(filePath, 'utf-8');
      expect(content).not.toContain('configDependencies');
      expect(content).not.toContain('pnpm-plugin-sku');
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'removed pnpm-plugin-sku from configDependencies in pnpm-workspace.yaml',
        ),
      );

      logSpy.mockRestore();
    });
  });

  it('plugin migration: preserves other plugins in configDependencies', async () => {
    await withTempDir(async (dir) => {
      const filePath = join(dir, 'pnpm-workspace.yaml');
      await writeFile(
        filePath,
        `
configDependencies:
  other-plugin: ^1.0.0
  pnpm-plugin-sku: 0.0.3+sha512-test
`,
        'utf-8',
      );

      await ensurePnpmWorkspaceConfig({ targetDir: dir, mode: 'additive' });

      const content = await readFile(filePath, 'utf-8');
      expect(content).toContain('configDependencies:');
      expect(content).toContain('other-plugin: ^1.0.0');
      expect(content).not.toContain('pnpm-plugin-sku');
    });
  });

  it('unions and dedupes array settings', async () => {
    await withTempDir(async (dir) => {
      const filePath = join(dir, 'pnpm-workspace.yaml');
      await writeFile(
        filePath,
        `
publicHoistPattern:
  - eslint
  - eslint
  - my-dep
`,
        'utf-8',
      );

      await ensurePnpmWorkspaceConfig({ targetDir: dir, mode: 'additive' });

      const content = await readFile(filePath, 'utf-8');
      const doc = parseDocument(content);
      const items = (doc.toJS() as any).publicHoistPattern;

      expect(items).toEqual(['eslint', 'my-dep', 'prettier']);
    });
  });
});
