import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync, realpathSync } from 'node:fs';

import type { PackageJson } from 'type-fest';
import { createDebug } from 'obug';
import { createRequire } from 'node:module';

const log = createDebug('sku:dependency-graph');

export const ROOT = 'ROOT';

const promiseMap = async <T, K>(
  items: T[],
  fn: (item: T) => Promise<K>,
): Promise<K[]> => Promise.all(items.map(fn));

export interface DepGraphEntry {
  name: string;
  /** `undefined` for `ROOT` */
  version?: string;
  peerDependencies?: PackageJson['peerDependencies'];
  /** Directories of the dependencies that depend on this package, or `ROOT` for the app */
  dependents: string[];
}

/** Every copy of every package in the walk, keyed by package directory */
export type DepGraph = Map<string, DepGraphEntry>;

const loadPackage = async (packageJsonPath: string) =>
  fs
    .readFile(packageJsonPath, 'utf-8')
    .then(JSON.parse) as Promise<PackageJson>;

/**
 * Returns the directory of `dep` as Node would resolve it from `fromDir`.
 */
const resolvePackageDir = (dep: string, fromDir: string) => {
  // Avoids `require.resolve`, which throws for packages whose `exports` omit `./package.json`.
  const lookupPaths =
    createRequire(path.join(fromDir, 'package.json')).resolve.paths(
      `${dep}/package.json`,
    ) ?? [];

  for (const lookupPath of lookupPaths) {
    const packageDir = path.join(lookupPath, dep);
    if (existsSync(path.join(packageDir, 'package.json'))) {
      // pnpm symlinks copies out of its store, so key each copy by its real path
      return realpathSync(packageDir);
    }
  }

  throw new Error(`Cannot find package "${dep}" from ${fromDir}`);
};

const analyseDependency = async (
  dependent: string,
  dep: string,
  rootDir: string,
  depGraph: DepGraph,
) => {
  const packageDir = resolvePackageDir(dep, rootDir);
  const packageJson = await loadPackage(path.join(packageDir, 'package.json'));

  // Checks if the package is already in the graph. If so, add it to the list of dependents.
  const depGraphEntry = depGraph.get(packageDir);

  if (depGraphEntry) {
    depGraphEntry.dependents.push(dependent);
    return;
  }

  depGraph.set(packageDir, {
    name: dep,
    version: packageJson.version,
    peerDependencies: packageJson.peerDependencies,
    dependents: [dependent],
  });

  const dependencies = Object.keys(packageJson.dependencies ?? {});
  const peerDependencies = Object.keys(packageJson.peerDependencies ?? {});

  await promiseMap([...dependencies, ...peerDependencies], async (childDep) => {
    try {
      await analyseDependency(packageDir, childDep, packageDir, depGraph);
    } catch (e) {
      log(`Error analysing dependency ${childDep} for ${dep}.`, e);
    }
  });
};

/**
 * Walks the dependency graph starting from the root package's `dependencies`
 * (and `devDependencies` with `includeDevDependencies`), following each
 * package's `dependencies` and `peerDependencies`.
 *
 * Known limitation: `optionalDependencies` are not walked, so packages
 * reachable only through them are not represented in the returned graph.
 */
export const extractDependencyGraph = async (
  rootDir: string,
  { includeDevDependencies = false } = {},
) => {
  log('starting to extract dependency graph...');
  const depGraph: DepGraph = new Map();

  const packageJson = await loadPackage(`${rootDir}/package.json`);

  const deps = Object.keys({
    ...packageJson.dependencies,
    ...(includeDevDependencies ? packageJson.devDependencies : {}),
  });

  depGraph.set(ROOT, {
    name: ROOT,
    dependents: [],
  });

  await promiseMap(deps, async (childDep) => {
    try {
      await analyseDependency(ROOT, childDep, rootDir, depGraph);
    } catch (e) {
      log(`Error analysing dependency ${childDep} for ${ROOT}.`, e);
    }
  });

  log('finished extracting dependency graph');
  return depGraph;
};

export const getSsrExternalsForCompiledDependency = (
  depName: string,
  depGraph: DepGraph,
): { noExternal: string[] } => {
  const noExternals = new Set<string>();
  const dependents = new Set(
    [...depGraph.values()]
      .filter((depGraphEntry) => depGraphEntry.name === depName)
      .flatMap((depGraphEntry) => depGraphEntry.dependents),
  );

  for (const dependentDir of dependents) {
    const dependent = depGraph.get(dependentDir);
    assert(dependent);

    noExternals.add(dependent.name);
    dependent.dependents.forEach((dep) => dependents.add(dep));
  }

  noExternals.delete(ROOT);

  const noExternal = Array.from(noExternals);

  log(
    `Found dependencies to prevent externalising for ${depName}:`,
    noExternal,
  );

  return {
    noExternal,
  };
};
