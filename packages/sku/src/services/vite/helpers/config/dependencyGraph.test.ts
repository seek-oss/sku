import { join } from 'node:path';
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
