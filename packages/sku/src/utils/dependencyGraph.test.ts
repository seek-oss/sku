import { join } from 'node:path';
import { createFixture } from 'fs-fixture';
import type { PackageJson } from 'type-fest';
import { describe, expect, it } from 'vitest';
import {
  extractDependencyGraph,
  getSsrExternalsForCompiledDependency,
  type DepGraph,
} from './dependencyGraph.js';

const createPackagesFixture = (packages: Record<string, PackageJson>) =>
  createFixture(
    Object.fromEntries(
      Object.entries(packages).map(([dir, packageJson]) => [
        join(dir, 'package.json'),
        JSON.stringify(packageJson),
      ]),
    ),
  );

const copiesOf = (depGraph: DepGraph, name: string) =>
  [...depGraph].filter(([, entry]) => entry.name === name);

describe('getSsrExternalsForCompiledDependency', () => {
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

  it('bundles packages whose exports do not include package.json', async () => {
    await using fixture = await createPackagesFixture({
      '.': {
        name: 'app',
        dependencies: { 'lib-a': '*' },
      },
      'node_modules/lib-a': {
        name: 'lib-a',
        exports: { '.': './index.js' },
        dependencies: { '@vanilla-extract/css': '*' },
      },
      'node_modules/@vanilla-extract/css': {
        name: '@vanilla-extract/css',
      },
    });

    expect(await getNoExternal(fixture.path)).toEqual(['lib-a']);
  });
});

describe('extractDependencyGraph', () => {
  it('records the version and peerDependencies of each package', async () => {
    await using fixture = await createPackagesFixture({
      '.': {
        name: 'app',
        dependencies: { 'lib-a': '*' },
      },
      'node_modules/lib-a': {
        name: 'lib-a',
        version: '1.0.0',
        peerDependencies: { react: '^19.0.0' },
      },
      'node_modules/react': {
        name: 'react',
        version: '19.0.0',
      },
    });

    const depGraph = await extractDependencyGraph(fixture.path);
    const [[libADir, libA]] = copiesOf(depGraph, 'lib-a');
    const [[, react]] = copiesOf(depGraph, 'react');

    expect(depGraph.get('ROOT')?.version).toBeUndefined();
    expect(libA).toMatchObject({
      version: '1.0.0',
      peerDependencies: { react: '^19.0.0' },
    });
    expect(react).toMatchObject({ version: '19.0.0', dependents: [libADir] });
  });

  it('walks root devDependencies only with includeDevDependencies', async () => {
    await using fixture = await createPackagesFixture({
      '.': {
        name: 'app',
        dependencies: { react: '*' },
        devDependencies: { '@vanilla-extract/css': '*' },
      },
      'node_modules/react': { name: 'react' },
      'node_modules/@vanilla-extract/css': { name: '@vanilla-extract/css' },
    });

    const getNames = async (options?: { includeDevDependencies: boolean }) =>
      [...(await extractDependencyGraph(fixture.path, options)).values()]
        .map((entry) => entry.name)
        .toSorted();

    expect(await getNames()).toEqual(['ROOT', 'react']);
    expect(await getNames({ includeDevDependencies: true })).toEqual([
      '@vanilla-extract/css',
      'ROOT',
      'react',
    ]);
  });

  it('keys each nested (npm/yarn) copy by its directory', async () => {
    await using fixture = await createPackagesFixture({
      '.': {
        name: 'app',
        dependencies: { 'lib-a': '*', 'lib-b': '*' },
      },
      'node_modules/lib-a': {
        name: 'lib-a',
        dependencies: { react: '*' },
      },
      'node_modules/lib-a/node_modules/react': {
        name: 'react',
        version: '18.3.1',
      },
      'node_modules/lib-b': {
        name: 'lib-b',
        dependencies: { react: '*' },
      },
      'node_modules/lib-b/node_modules/react': {
        name: 'react',
        version: '19.0.0',
      },
    });

    const depGraph = await extractDependencyGraph(fixture.path);

    expect(
      copiesOf(depGraph, 'react')
        .map(([, { version }]) => version)
        .toSorted(),
    ).toEqual(['18.3.1', '19.0.0']);
  });

  it('keys each pnpm-style symlinked copy by its real directory', async () => {
    await using fixture = await createFixture({
      'package.json': JSON.stringify({
        name: 'app',
        dependencies: { 'lib-a': '*', 'lib-b': '*' },
      }),
      'node_modules/lib-a': ({ symlink }) =>
        symlink('.pnpm/lib-a@1.0.0/node_modules/lib-a'),
      'node_modules/lib-b': ({ symlink }) =>
        symlink('.pnpm/lib-b@1.0.0/node_modules/lib-b'),
      'node_modules/.pnpm': {
        'lib-a@1.0.0/node_modules': {
          'lib-a/package.json': JSON.stringify({
            name: 'lib-a',
            dependencies: { react: '*' },
          }),
          react: ({ symlink }) =>
            symlink('../../react@18.3.1/node_modules/react'),
        },
        'lib-b@1.0.0/node_modules': {
          'lib-b/package.json': JSON.stringify({
            name: 'lib-b',
            dependencies: { react: '*' },
          }),
          react: ({ symlink }) =>
            symlink('../../react@19.0.0/node_modules/react'),
        },
        'react@18.3.1/node_modules/react/package.json': JSON.stringify({
          name: 'react',
          version: '18.3.1',
        }),
        'react@19.0.0/node_modules/react/package.json': JSON.stringify({
          name: 'react',
          version: '19.0.0',
        }),
      },
    });

    const reactCopies = copiesOf(
      await extractDependencyGraph(fixture.path),
      'react',
    );

    expect(reactCopies).toHaveLength(2);
    for (const [directory, { version }] of reactCopies) {
      expect(directory).toContain(join('.pnpm', `react@${version}`));
    }
  });
});
