import { describe, expect, it, vi, afterEach } from 'vitest';
import { createFixture } from 'fs-fixture';

import type { DepGraph } from './dependencyGraph.js';
import {
  checkDuplicatePackages,
  classifyDuplicatePackages,
} from './duplicatePackages.js';

type TestEntry = {
  name: string;
  version?: string;
  dependents: string[];
  peerDependencies?: Record<string, string>;
  skuCompilePackage?: boolean;
  resolutions?: Record<string, string>;
};

const graph = (entries: Array<[string, TestEntry]>): DepGraph =>
  new Map([['ROOT', { name: 'ROOT', dependents: [] }], ...entries]);

describe('classifyDuplicatePackages', () => {
  it('emits a finding for duplicate distinct versions with chains and why hint', () => {
    const report = classifyDuplicatePackages(
      graph([
        [
          '/app/node_modules/lib-a',
          { name: 'lib-a', version: '1.0.0', dependents: ['ROOT'] },
        ],
        [
          '/app/node_modules/lib-a/node_modules/react',
          {
            name: 'react',
            version: '18.3.1',
            dependents: ['/app/node_modules/lib-a'],
          },
        ],
        [
          '/app/node_modules/react',
          { name: 'react', version: '19.0.0', dependents: ['ROOT'] },
        ],
      ]),
      { whyCommand: 'pnpm why -r' },
    );

    expect(report.findings).toHaveLength(1);
    expect(report.findings[0].packageName).toBe('react');
    expect(report.findings[0].whyCommand).toBe('pnpm why -r');
    expect(report.findings[0].copies.map((c) => c.version)).toEqual([
      '18.3.1',
      '19.0.0',
    ]);
    expect(
      report.findings[0].copies.find((c) => c.version === '18.3.1')?.chain,
    ).toEqual(['your app', 'lib-a', 'react']);
  });

  it('does not emit a finding for same version in multiple directories', () => {
    const report = classifyDuplicatePackages(
      graph([
        [
          '/a/react',
          { name: 'react', version: '19.0.0', dependents: ['ROOT'] },
        ],
        [
          '/b/react',
          { name: 'react', version: '19.0.0', dependents: ['ROOT'] },
        ],
      ]),
    );

    expect(report.findings).toEqual([]);
    expect(report.sameVersionDuplicates).toEqual([
      {
        packageName: 'react',
        version: '19.0.0',
        directories: ['/a/react', '/b/react'],
      },
    ]);
  });

  it('reports a react/react-dom pair mismatch only when both are present and sets differ', () => {
    const mismatched = classifyDuplicatePackages(
      graph([
        [
          '/a/react',
          { name: 'react', version: '19.0.0', dependents: ['ROOT'] },
        ],
        [
          '/a/react-dom',
          { name: 'react-dom', version: '18.3.1', dependents: ['ROOT'] },
        ],
      ]),
    );
    expect(mismatched.pairMismatch?.reactVersions).toEqual(['19.0.0']);
    expect(mismatched.pairMismatch?.reactDomVersions).toEqual(['18.3.1']);

    const matching = classifyDuplicatePackages(
      graph([
        [
          '/a/react',
          { name: 'react', version: '19.0.0', dependents: ['ROOT'] },
        ],
        [
          '/a/react-dom',
          { name: 'react-dom', version: '19.0.0', dependents: ['ROOT'] },
        ],
      ]),
    );
    expect(matching.pairMismatch).toBeUndefined();

    const reactOnly = classifyDuplicatePackages(
      graph([
        [
          '/a/react',
          { name: 'react', version: '19.0.0', dependents: ['ROOT'] },
        ],
      ]),
    );
    expect(reactOnly.pairMismatch).toBeUndefined();
  });

  it('ignores entries without a version and unwatched packages', () => {
    const report = classifyDuplicatePackages(
      graph([
        ['/a/react', { name: 'react', dependents: ['ROOT'] }],
        [
          '/b/react',
          { name: 'react', version: '19.0.0', dependents: ['ROOT'] },
        ],
        [
          '/a/lodash',
          { name: 'lodash', version: '1.0.0', dependents: ['ROOT'] },
        ],
        [
          '/b/lodash',
          { name: 'lodash', version: '2.0.0', dependents: ['ROOT'] },
        ],
      ]),
    );

    expect(report.findings).toEqual([]);
    expect(report.pairMismatch).toBeUndefined();
  });

  it('checks packages flagged skuCompilePackage in the graph', () => {
    const report = classifyDuplicatePackages(
      graph([
        [
          '/a/@seek/lib',
          {
            name: '@seek/lib',
            version: '1.0.0',
            dependents: ['ROOT'],
            skuCompilePackage: true,
          },
        ],
        [
          '/b/@seek/lib',
          {
            name: '@seek/lib',
            version: '2.0.0',
            dependents: ['ROOT'],
            skuCompilePackage: true,
          },
        ],
        [
          '/a/@seek/unflagged',
          { name: '@seek/unflagged', version: '1.0.0', dependents: ['ROOT'] },
        ],
        [
          '/b/@seek/unflagged',
          { name: '@seek/unflagged', version: '2.0.0', dependents: ['ROOT'] },
        ],
      ]),
    );

    expect(report.findings.map((f) => f.packageName)).toEqual(['@seek/lib']);
  });

  it('checks extra candidate packages passed by the caller', () => {
    const report = classifyDuplicatePackages(
      graph([
        [
          '/a/my-lib',
          { name: 'my-lib', version: '1.0.0', dependents: ['ROOT'] },
        ],
        [
          '/b/my-lib',
          { name: 'my-lib', version: '2.0.0', dependents: ['ROOT'] },
        ],
      ]),
      { candidatePackages: ['my-lib'] },
    );

    expect(report.findings.map((f) => f.packageName)).toEqual(['my-lib']);
  });

  it('reports a peer mismatch for the copy a candidate actually resolves', () => {
    const report = classifyDuplicatePackages(
      graph([
        [
          '/a/@seek/lib',
          {
            name: '@seek/lib',
            version: '1.0.0',
            dependents: ['ROOT'],
            skuCompilePackage: true,
            peerDependencies: { 'braid-design-system': '^31.0.0' },
            resolutions: { 'braid-design-system': '/a/braid-design-system' },
          },
        ],
        [
          '/a/braid-design-system',
          {
            name: 'braid-design-system',
            version: '32.0.0',
            dependents: ['/a/@seek/lib'],
          },
        ],
      ]),
    );

    expect(report.peerMismatches).toHaveLength(1);
    expect(report.peerMismatches[0]).toMatchObject({
      packageName: '@seek/lib',
      peerName: 'braid-design-system',
      peerVersionRange: '^31.0.0',
      resolvedPeerVersion: '32.0.0',
      resolvedPeerIsAhead: true,
    });
  });

  it('does not report a peer mismatch when the resolved copy satisfies the range, the range is invalid, or react-dom peers react', () => {
    const satisfied = classifyDuplicatePackages(
      graph([
        [
          '/a/@seek/lib',
          {
            name: '@seek/lib',
            version: '1.0.0',
            dependents: ['ROOT'],
            skuCompilePackage: true,
            peerDependencies: { 'braid-design-system': '^32.0.0' },
            resolutions: { 'braid-design-system': '/a/braid-design-system' },
          },
        ],
        [
          '/a/braid-design-system',
          {
            name: 'braid-design-system',
            version: '32.1.0',
            dependents: ['/a/@seek/lib'],
          },
        ],
      ]),
    );
    expect(satisfied.peerMismatches).toEqual([]);

    const invalidAndPair = classifyDuplicatePackages(
      graph([
        [
          '/a/react-dom',
          {
            name: 'react-dom',
            version: '18.3.1',
            dependents: ['ROOT'],
            peerDependencies: { react: '^18.0.0', 'some-lib': 'workspace:*' },
            resolutions: { react: '/a/react', 'some-lib': '/a/some-lib' },
          },
        ],
        [
          '/a/react',
          { name: 'react', version: '19.0.0', dependents: ['/a/react-dom'] },
        ],
        [
          '/a/some-lib',
          { name: 'some-lib', version: '1.0.0', dependents: ['/a/react-dom'] },
        ],
      ]),
      { candidatePackages: ['some-lib'] },
    );
    // react/react-dom is covered by the pair check, and `workspace:*` is not
    // a semver range, so neither produces a peer mismatch
    expect(invalidAndPair.peerMismatches).toEqual([]);
    expect(invalidAndPair.pairMismatch).toBeDefined();
  });

  it('evaluates peer ranges per copy rather than collapsing copies by name', () => {
    const report = classifyDuplicatePackages(
      graph([
        [
          '/a/@seek/lib',
          {
            name: '@seek/lib',
            version: '1.0.0',
            dependents: ['ROOT'],
            skuCompilePackage: true,
            peerDependencies: { react: '^18.0.0' },
            resolutions: { react: '/a/react' },
          },
        ],
        [
          '/b/@seek/lib',
          {
            name: '@seek/lib',
            version: '1.0.0',
            dependents: ['ROOT'],
            skuCompilePackage: true,
            peerDependencies: { react: '^19.0.0' },
            resolutions: { react: '/b/react' },
          },
        ],
        [
          '/a/react',
          { name: 'react', version: '18.3.1', dependents: ['/a/@seek/lib'] },
        ],
        [
          '/b/react',
          { name: 'react', version: '19.0.0', dependents: ['/b/@seek/lib'] },
        ],
      ]),
    );

    expect(report.peerMismatches).toEqual([]);
  });
});

describe('checkDuplicatePackages', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await using fixture = await createFixture(duplicateReactFixture());

    await expect(checkDuplicatePackages(fixture.path)).resolves.toEqual({
      exitCode: 0,
    });
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('Duplicate packages detected');
    expect(output).toContain('18.3.1');
    expect(output).toContain('19.0.0');
  });

  it('warns on duplicate compile package versions passed as candidates', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await using fixture = await createFixture({
      'package.json': JSON.stringify({
        name: 'app',
        dependencies: { 'lib-a': '*', 'lib-b': '*' },
      }),
      'node_modules/lib-a/package.json': JSON.stringify({
        name: 'lib-a',
        version: '1.0.0',
        dependencies: { '@seek/lib': '*' },
      }),
      'node_modules/lib-a/node_modules/@seek/lib/package.json': JSON.stringify({
        name: '@seek/lib',
        version: '1.0.0',
        skuCompilePackage: true,
      }),
      'node_modules/lib-b/package.json': JSON.stringify({
        name: 'lib-b',
        version: '1.0.0',
        dependencies: { '@seek/lib': '*' },
      }),
      'node_modules/lib-b/node_modules/@seek/lib/package.json': JSON.stringify({
        name: '@seek/lib',
        version: '2.0.0',
        skuCompilePackage: true,
      }),
    });

    await expect(
      checkDuplicatePackages({
        rootDir: fixture.path,
        candidatePackages: ['@seek/lib'],
      }),
    ).resolves.toEqual({ exitCode: 0 });
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('Duplicate packages detected');
    expect(output).toContain('@seek/lib');
  });

  it('warns on a compile package peer version mismatch', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await using fixture = await createFixture({
      'package.json': JSON.stringify({
        name: 'app',
        dependencies: { '@seek/lib': '*' },
      }),
      'node_modules/@seek/lib/package.json': JSON.stringify({
        name: '@seek/lib',
        version: '1.0.0',
        skuCompilePackage: true,
        peerDependencies: { 'braid-design-system': '^31.0.0' },
      }),
      'node_modules/braid-design-system/package.json': JSON.stringify({
        name: 'braid-design-system',
        version: '32.0.0',
      }),
    });

    await expect(checkDuplicatePackages(fixture.path)).resolves.toEqual({
      exitCode: 0,
    });
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('Duplicate packages detected');
    expect(output).toContain('expected to find');
    expect(output).toContain('braid-design-system');
  });

  it('does not warn when skuSkipValidatePeerDeps is set', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await using fixture = await createFixture(
      duplicateReactFixture({ skuSkipValidatePeerDeps: true }),
    );

    await expect(checkDuplicatePackages(fixture.path)).resolves.toEqual({
      exitCode: 0,
    });
    expect(logSpy.mock.calls.flat().join('\n')).not.toContain(
      'Duplicate packages detected',
    );
  });

  it('does not warn for a single version of each watched package', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
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
      }),
    });

    await expect(checkDuplicatePackages(fixture.path)).resolves.toEqual({
      exitCode: 0,
    });
    expect(logSpy.mock.calls.flat().join('\n')).not.toContain(
      'Duplicate packages detected',
    );
  });

  it('does not throw or warn when dependencies cannot be resolved', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await using fixture = await createFixture({});

    await expect(checkDuplicatePackages(fixture.path)).resolves.toEqual({
      exitCode: 0,
    });
    expect(logSpy.mock.calls.flat().join('\n')).not.toContain(
      'Duplicate packages detected',
    );
  });
});
