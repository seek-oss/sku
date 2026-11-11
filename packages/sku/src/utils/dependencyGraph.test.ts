import { join } from 'node:path';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { createFixture } from 'fs-fixture';
import type { PackageJson } from 'type-fest';
import { describe, expect, it } from 'vitest';
import {
  extractDependencyGraph,
  getSsrExternalsForCompiledDependency,
} from './dependencyGraph.js';

describe('getSsrExternalsForCompiledDependency', () => {
  const createPackagesFixture = (packages: Record<string, PackageJson>) =>
    createFixture(
      Object.fromEntries(
        Object.entries(packages).map(([dir, packageJson]) => [
          join(dir, 'package.json'),
          JSON.stringify(packageJson),
        ]),
      ),
    );

  const getNoExternal = async (appDir: string) => {
    const depGraph = await extractDependencyGraph(appDir);
    return getSsrExternalsForCompiledDependency(
      '@vanilla-extract/css',
      depGraph,
    ).noExternal.toSorted();
  };

  it('bundles packages on a path to Vanilla Extract, and nothing else', async () => {
    await using fixture = await createPackagesFixture({
      '.': {
        name: 'app',
        dependencies: { 'lib-a': '*', unrelated: '*' },
      },
      'node_modules/lib-a': {
        name: 'lib-a',
        dependencies: { 'lib-b': '*' },
      },
      'node_modules/lib-b': {
        name: 'lib-b',
        dependencies: { '@vanilla-extract/css': '*' },
      },
      'node_modules/@vanilla-extract/css': {
        name: '@vanilla-extract/css',
      },
      'node_modules/unrelated': {
        name: 'unrelated',
      },
    });

    expect(await getNoExternal(fixture.path)).toEqual(['lib-a', 'lib-b']);
  });

  it('bundles the dependents of every Vanilla Extract copy', async () => {
    await using fixture = await createPackagesFixture({
      '.': {
        name: 'app',
        dependencies: { 'lib-a': '*', 'lib-b': '*' },
      },
      'node_modules/lib-a': {
        name: 'lib-a',
        dependencies: { '@vanilla-extract/css': '*' },
      },
      'node_modules/@vanilla-extract/css': {
        name: '@vanilla-extract/css',
      },
      'node_modules/lib-b': {
        name: 'lib-b',
        dependencies: { '@vanilla-extract/css': '*' },
      },
      'node_modules/lib-b/node_modules/@vanilla-extract/css': {
        name: '@vanilla-extract/css',
      },
    });

    expect(await getNoExternal(fixture.path)).toEqual(['lib-a', 'lib-b']);
  });

  it('walks the dependencies of a second copy of a package', async () => {
    await using fixture = await createPackagesFixture({
      '.': {
        name: 'app',
        dependencies: { 'lib-c': '*', 'lib-d': '*' },
      },
      'node_modules/lib-c': {
        name: 'lib-c',
      },
      'node_modules/lib-d': {
        name: 'lib-d',
        dependencies: { 'lib-c': '*' },
      },
      'node_modules/lib-d/node_modules/lib-c': {
        name: 'lib-c',
        dependencies: { '@vanilla-extract/css': '*' },
      },
      'node_modules/@vanilla-extract/css': {
        name: '@vanilla-extract/css',
      },
    });

    expect(await getNoExternal(fixture.path)).toEqual(['lib-c', 'lib-d']);
  });
});

describe('extractDependencyGraph', () => {
  it('records the version of each package, with no version for ROOT', async () => {
    await using fixture = await createFixture({
      'package.json': JSON.stringify({
        name: 'app',
        dependencies: { 'lib-a': '*' },
      }),
      'node_modules/lib-a/package.json': JSON.stringify({
        name: 'lib-a',
        version: '1.2.3',
      }),
    });

    const depGraph = await extractDependencyGraph(fixture.path);

    expect(depGraph.get('ROOT')?.version).toBeUndefined();
    expect(
      [...depGraph.values()].find((e) => e.name === 'lib-a')?.version,
    ).toBe('1.2.3');
  });

  it('records peerDependencies, the skuCompilePackage flag, and per-package resolutions', async () => {
    await using fixture = await createFixture({
      'package.json': JSON.stringify({
        name: 'app',
        dependencies: { 'lib-a': '*' },
      }),
      'node_modules/lib-a/package.json': JSON.stringify({
        name: 'lib-a',
        version: '1.0.0',
        skuCompilePackage: true,
        peerDependencies: { react: '^19.0.0' },
      }),
      'node_modules/react/package.json': JSON.stringify({
        name: 'react',
        version: '19.0.0',
      }),
    });

    const depGraph = await extractDependencyGraph(fixture.path);
    const libA = [...depGraph.entries()].find(([, e]) => e.name === 'lib-a');
    const react = [...depGraph.entries()].find(([, e]) => e.name === 'react');

    expect(libA?.[1].skuCompilePackage).toBe(true);
    expect(libA?.[1].peerDependencies).toEqual({ react: '^19.0.0' });
    expect(libA?.[1].resolutions).toEqual({ react: react?.[0] });
    expect(react?.[1].skuCompilePackage).toBe(false);
  });

  it('produces equivalent versions for nested (npm/yarn) layouts', async () => {
    await using fixture = await createFixture({
      'package.json': JSON.stringify({
        name: 'app',
        dependencies: { 'lib-a': '*', 'lib-b': '*' },
      }),
      'node_modules/lib-a/package.json': JSON.stringify({
        name: 'lib-a',
        version: '1.0.0',
        dependencies: { react: '*' },
      }),
      'node_modules/lib-a/node_modules/react/package.json': JSON.stringify({
        name: 'react',
        version: '18.3.1',
      }),
      'node_modules/lib-b/package.json': JSON.stringify({
        name: 'lib-b',
        version: '1.0.0',
        dependencies: { react: '*' },
      }),
      'node_modules/lib-b/node_modules/react/package.json': JSON.stringify({
        name: 'react',
        version: '19.0.0',
      }),
    });

    const depGraph = await extractDependencyGraph(fixture.path);
    const reactVersions = [...depGraph.values()]
      .filter((e) => e.name === 'react')
      .map((e) => e.version)
      .toSorted();

    expect(reactVersions).toEqual(['18.3.1', '19.0.0']);
  });

  it('keys pnpm-style symlinked copies as distinct directories', async () => {
    const root = await mkdtemp(join(tmpdir(), 'sku-pnpm-graph-'));
    try {
      const writePkg = async (dir: string, pkg: PackageJson) => {
        await mkdir(dir, { recursive: true });
        await writeFile(join(dir, 'package.json'), JSON.stringify(pkg));
      };

      await writePkg(root, {
        name: 'app',
        dependencies: { 'lib-a': '*', 'lib-b': '*' },
      });

      const pnpm = join(root, 'node_modules', '.pnpm');
      const libA = join(pnpm, 'lib-a@1.0.0', 'node_modules', 'lib-a');
      const libB = join(pnpm, 'lib-b@1.0.0', 'node_modules', 'lib-b');
      const react18 = join(pnpm, 'react@18.3.1', 'node_modules', 'react');
      const react19 = join(pnpm, 'react@19.0.0', 'node_modules', 'react');

      await writePkg(libA, {
        name: 'lib-a',
        version: '1.0.0',
        dependencies: { react: '*' },
      });
      await writePkg(libB, {
        name: 'lib-b',
        version: '1.0.0',
        dependencies: { react: '*' },
      });
      await writePkg(react18, { name: 'react', version: '18.3.1' });
      await writePkg(react19, { name: 'react', version: '19.0.0' });

      await symlink(
        react18,
        join(pnpm, 'lib-a@1.0.0', 'node_modules', 'react'),
        'dir',
      );
      await symlink(
        react19,
        join(pnpm, 'lib-b@1.0.0', 'node_modules', 'react'),
        'dir',
      );
      await symlink(libA, join(root, 'node_modules', 'lib-a'), 'dir');
      await symlink(libB, join(root, 'node_modules', 'lib-b'), 'dir');

      const depGraph = await extractDependencyGraph(root);
      const reactEntries = [...depGraph.entries()].filter(
        ([, e]) => e.name === 'react',
      );

      // Copies must not collapse into a single graph key
      expect(reactEntries).toHaveLength(2);
      expect(reactEntries.map(([, e]) => e.version).toSorted()).toEqual([
        '18.3.1',
        '19.0.0',
      ]);
      expect(new Set(reactEntries.map(([dir]) => dir)).size).toBe(2);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
