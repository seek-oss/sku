import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFixture } from 'fs-fixture';

import type { DepGraph, DepGraphEntry } from './dependencyGraph.js';
import {
  checkDuplicatePackages,
  classifyDuplicatePackages,
} from './duplicatePackages.js';

const graph = (entries: Record<string, DepGraphEntry>): DepGraph =>
  new Map([
    ['ROOT', { name: 'ROOT', dependents: [] }],
    ...Object.entries(entries),
  ]);

const summarise = ({
  duplicates,
  versionMismatches,
}: ReturnType<typeof classifyDuplicatePackages>) => ({
  duplicates: duplicates.map((copies) =>
    copies.map(({ name, version }) => `${name}@${version}`),
  ),
  versionMismatches: versionMismatches.map(
    ({ copy, peer, expectedRange }) =>
      `${copy.name}@${copy.version} expected ${peer.name} ${expectedRange}, resolved ${peer.version}`,
  ),
});

describe('classifyDuplicatePackages', () => {
  it('reports a watched package resolved at more than one version', () => {
    const report = classifyDuplicatePackages(
      graph({
        '/lib-a': { name: 'lib-a', version: '1.0.0', dependents: ['ROOT'] },
        '/lib-a/react': {
          name: 'react',
          version: '19.0.0',
          dependents: ['/lib-a'],
        },
        '/react': { name: 'react', version: '18.3.1', dependents: ['ROOT'] },
      }),
    );

    expect(summarise(report)).toEqual({
      duplicates: [['react@18.3.1', 'react@19.0.0']],
      versionMismatches: [],
    });
  });

  it('ignores same-version copies, copies without a version, and packages that are not candidates', () => {
    const report = classifyDuplicatePackages(
      graph({
        '/a/react': { name: 'react', version: '19.0.0', dependents: ['ROOT'] },
        '/b/react': { name: 'react', version: '19.0.0', dependents: ['ROOT'] },
        '/c/react': { name: 'react', dependents: ['ROOT'] },
        '/a/@seek/lib': {
          name: '@seek/lib',
          version: '1.0.0',
          dependents: ['ROOT'],
        },
        '/b/@seek/lib': {
          name: '@seek/lib',
          version: '2.0.0',
          dependents: ['ROOT'],
        },
      }),
    );

    expect(summarise(report)).toEqual({
      duplicates: [],
      versionMismatches: [],
    });
  });

  it('checks candidate packages passed by the caller', () => {
    const report = classifyDuplicatePackages(
      graph({
        '/a/@seek/lib': {
          name: '@seek/lib',
          version: '1.0.0',
          dependents: ['ROOT'],
        },
        '/b/@seek/lib': {
          name: '@seek/lib',
          version: '2.0.0',
          dependents: ['ROOT'],
        },
      }),
      ['@seek/lib'],
    );

    expect(summarise(report).duplicates).toEqual([
      ['@seek/lib@1.0.0', '@seek/lib@2.0.0'],
    ]);
  });

  it('checks peer ranges against the copy each package copy resolves', () => {
    const report = classifyDuplicatePackages(
      graph({
        '/a/@seek/lib': {
          name: '@seek/lib',
          version: '1.0.0',
          peerDependencies: { 'braid-design-system': '^31.0.0' },
          dependents: ['ROOT'],
        },
        '/b/@seek/lib': {
          name: '@seek/lib',
          version: '2.0.0',
          peerDependencies: { 'braid-design-system': '^32.0.0' },
          dependents: ['ROOT'],
        },
        '/a/braid-design-system': {
          name: 'braid-design-system',
          version: '32.0.0',
          dependents: ['/a/@seek/lib', '/b/@seek/lib'],
        },
        '/c/braid-design-system': {
          name: 'braid-design-system',
          version: '31.0.0',
          dependents: ['ROOT'],
        },
      }),
      ['@seek/lib'],
    );

    expect(summarise(report).versionMismatches).toEqual([
      '@seek/lib@1.0.0 expected braid-design-system ^31.0.0, resolved 32.0.0',
    ]);
  });

  it('ignores non-semver peer ranges and prereleases within the range', () => {
    const report = classifyDuplicatePackages(
      graph({
        '/@seek/lib': {
          name: '@seek/lib',
          version: '1.0.0',
          peerDependencies: {
            'braid-design-system': 'workspace:*',
            react: '^19.0.0',
          },
          dependents: ['ROOT'],
        },
        '/braid-design-system': {
          name: 'braid-design-system',
          version: '32.0.0',
          dependents: ['/@seek/lib'],
        },
        '/react': {
          name: 'react',
          version: '19.1.0-canary-abc',
          dependents: ['/@seek/lib'],
        },
      }),
      ['@seek/lib'],
    );

    expect(summarise(report).versionMismatches).toEqual([]);
  });

  it('requires react-dom to resolve the same version of react', () => {
    const mismatched = classifyDuplicatePackages(
      graph({
        '/react-dom': {
          name: 'react-dom',
          version: '19.1.0',
          peerDependencies: { react: '^19.1.0' },
          dependents: ['ROOT'],
        },
        '/react': {
          name: 'react',
          version: '19.1.1',
          dependents: ['ROOT', '/react-dom'],
        },
      }),
    );
    expect(summarise(mismatched).versionMismatches).toEqual([
      'react-dom@19.1.0 expected react 19.1.0, resolved 19.1.1',
    ]);

    const matching = classifyDuplicatePackages(
      graph({
        '/react-dom': {
          name: 'react-dom',
          version: '19.1.0',
          peerDependencies: { react: '^19.1.0' },
          dependents: ['ROOT'],
        },
        '/react': {
          name: 'react',
          version: '19.1.0',
          dependents: ['ROOT', '/react-dom'],
        },
        '/lib-a/react': {
          name: 'react',
          version: '19.0.0',
          dependents: ['/lib-a'],
        },
      }),
    );
    expect(summarise(matching).versionMismatches).toEqual([]);
  });
});

describe('checkDuplicatePackages', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const captureOutput = () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    return () => logSpy.mock.calls.flat().join('\n');
  };

  const duplicateReactFixture = (extra: Record<string, unknown> = {}) => ({
    'package.json': JSON.stringify({
      name: 'app',
      dependencies: { 'lib-a': '*', 'lib-b': '*' },
      ...extra,
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

  it('warns on duplicate react versions and still exits 0', async () => {
    const getOutput = captureOutput();
    await using fixture = await createFixture(duplicateReactFixture());

    await expect(
      checkDuplicatePackages({ rootDir: fixture.path }),
    ).resolves.toEqual({ exitCode: 0 });

    const output = getOutput();
    expect(output).toContain('Duplicate packages detected');
    expect(output).toContain('18.3.1');
    expect(output).toContain('19.0.0');
    expect(output).toContain('your app > lib-a > react');
  });

  it('warns when a devDependency and a dependency resolve different copies', async () => {
    const getOutput = captureOutput();
    await using fixture = await createFixture({
      'package.json': JSON.stringify({
        name: 'app',
        dependencies: { 'braid-design-system': '*' },
        devDependencies: { '@vanilla-extract/css': '*' },
      }),
      'node_modules/@vanilla-extract/css/package.json': JSON.stringify({
        name: '@vanilla-extract/css',
        version: '1.18.0',
      }),
      'node_modules/braid-design-system/package.json': JSON.stringify({
        name: 'braid-design-system',
        version: '34.0.0',
        dependencies: { '@vanilla-extract/css': '*' },
      }),
      'node_modules/braid-design-system/node_modules/@vanilla-extract/css/package.json':
        JSON.stringify({ name: '@vanilla-extract/css', version: '1.17.0' }),
    });

    await checkDuplicatePackages({ rootDir: fixture.path });

    const output = getOutput();
    expect(output).toContain('@vanilla-extract/css');
    expect(output).toContain('1.17.0');
    expect(output).toContain('1.18.0');
  });

  it('warns on duplicate compile package versions passed as candidates', async () => {
    const getOutput = captureOutput();
    await using fixture = await createFixture({
      'package.json': JSON.stringify({
        name: 'app',
        dependencies: { 'lib-a': '*', 'lib-b': '*' },
      }),
      'node_modules/lib-a/package.json': JSON.stringify({
        name: 'lib-a',
        dependencies: { '@seek/lib': '*' },
      }),
      'node_modules/lib-a/node_modules/@seek/lib/package.json': JSON.stringify({
        name: '@seek/lib',
        version: '1.0.0',
      }),
      'node_modules/lib-b/package.json': JSON.stringify({
        name: 'lib-b',
        dependencies: { '@seek/lib': '*' },
      }),
      'node_modules/lib-b/node_modules/@seek/lib/package.json': JSON.stringify({
        name: '@seek/lib',
        version: '2.0.0',
      }),
    });

    await checkDuplicatePackages({
      rootDir: fixture.path,
      candidatePackages: ['@seek/lib'],
    });

    const output = getOutput();
    expect(output).toContain('Duplicate packages detected');
    expect(output).toContain('@seek/lib');
  });

  it('warns on peer version mismatches', async () => {
    const getOutput = captureOutput();
    await using fixture = await createFixture({
      'package.json': JSON.stringify({
        name: 'app',
        dependencies: { '@seek/lib': '*', react: '*', 'react-dom': '*' },
      }),
      'node_modules/@seek/lib/package.json': JSON.stringify({
        name: '@seek/lib',
        version: '1.0.0',
        peerDependencies: { 'braid-design-system': '^31.0.0' },
      }),
      'node_modules/braid-design-system/package.json': JSON.stringify({
        name: 'braid-design-system',
        version: '32.0.0',
      }),
      'node_modules/react/package.json': JSON.stringify({
        name: 'react',
        version: '19.0.0',
      }),
      'node_modules/react-dom/package.json': JSON.stringify({
        name: 'react-dom',
        version: '19.1.0',
        peerDependencies: { react: '^19.0.0' },
      }),
    });

    await expect(
      checkDuplicatePackages({
        rootDir: fixture.path,
        candidatePackages: ['@seek/lib'],
      }),
    ).resolves.toEqual({ exitCode: 0 });

    const output = getOutput();
    expect(output).toContain('expected to find');
    expect(output).toContain('to update its peer dependency');
    expect(output).toContain('must be installed at the same version');
  });

  it('does not warn when skuSkipValidatePeerDeps is set', async () => {
    const getOutput = captureOutput();
    await using fixture = await createFixture(
      duplicateReactFixture({ skuSkipValidatePeerDeps: true }),
    );

    await checkDuplicatePackages({ rootDir: fixture.path });

    expect(getOutput()).not.toContain('Duplicate packages detected');
  });

  it('does not warn for a single version of each watched package', async () => {
    const getOutput = captureOutput();
    await using fixture = await createFixture({
      'package.json': JSON.stringify({
        name: 'app',
        dependencies: { react: '*', 'react-dom': '*' },
      }),
      'node_modules/react/package.json': JSON.stringify({
        name: 'react',
        version: '19.0.0',
      }),
      'node_modules/react-dom/package.json': JSON.stringify({
        name: 'react-dom',
        version: '19.0.0',
        peerDependencies: { react: '^19.0.0' },
      }),
    });

    await checkDuplicatePackages({ rootDir: fixture.path });

    expect(getOutput()).not.toContain('Duplicate packages detected');
  });

  it('does not throw or warn when dependencies are not installed', async () => {
    const getOutput = captureOutput();
    await using fixture = await createFixture({
      'package.json': JSON.stringify({
        name: 'app',
        dependencies: { react: '*' },
      }),
    });

    await expect(
      checkDuplicatePackages({ rootDir: fixture.path }),
    ).resolves.toEqual({ exitCode: 0 });

    expect(getOutput()).not.toContain('Duplicate packages detected');
  });
});
