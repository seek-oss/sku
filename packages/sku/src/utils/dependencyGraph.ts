import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs/promises';

import type { PackageJson } from 'type-fest';
import { createDebug } from 'obug';
import { createRequire } from 'node:module';

const log = createDebug('sku:dependency-graph');

const require = createRequire(import.meta.url);

const ROOT = 'ROOT';

const promiseMap = async <T, K>(
  items: T[],
  fn: (item: T) => Promise<K>,
): Promise<K[]> => Promise.all(items.map(fn));

interface DepGraphEntry {
  name: string;
  /** Version from the package's `package.json`, if it declares one. The `ROOT` sentinel carries no version. */
  version?: string;
  /** `peerDependencies` declared in the package's `package.json` (name → range) */
  peerDependencies?: Record<string, string>;
  /** Whether the package's `package.json` sets `skuCompilePackage` */
  skuCompilePackage?: boolean;
  /**
   * Directories this package's dependencies resolved to, keyed by dependency
   * name, as resolved from this package's directory. Lets consumers tell
   * which copy of a peer a given copy of a package actually resolves.
   */
  resolutions?: Record<string, string>;
  /** Directories of the dependencies that depend on this package, or `ROOT` for the app */
  dependents: string[];
}

/** Every copy of every package in the walk, keyed by package directory */
export type DepGraph = Map<string, DepGraphEntry>;

const loadPackage = async (packageJsonPath: string) =>
  fs
    .readFile(packageJsonPath, 'utf-8')
    .then(JSON.parse) as Promise<PackageJson>;

const analyseDependency = async (
  dependent: string,
  dep: string,
  rootDir: string,
  depGraph: DepGraph,
) => {
  const packageJsonPath = require.resolve(`${dep}/package.json`, {
    paths: [rootDir],
  });
  const packageDir = path.dirname(packageJsonPath);
  const packageJson = await loadPackage(packageJsonPath);

  // Record which copy the dependent actually resolves for this dependency.
  const dependentEntry = depGraph.get(dependent);
  if (dependentEntry) {
    dependentEntry.resolutions = {
      ...dependentEntry.resolutions,
      [dep]: packageDir,
    };
  }

  // Checks if the package is already in the graph. If so, add it to the list of dependents.
  const depGraphEntry = depGraph.get(packageDir);

  if (depGraphEntry) {
    depGraphEntry.dependents.push(dependent);
    return;
  }

  depGraph.set(packageDir, {
    name: dep,
    version: packageJson.version,
    peerDependencies: packageJson.peerDependencies
      ? Object.fromEntries(
          Object.entries(packageJson.peerDependencies).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string',
          ),
        )
      : undefined,
    skuCompilePackage:
      (packageJson as { skuCompilePackage?: unknown }).skuCompilePackage ===
      true,
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
 * Walks the dependency graph starting from the root package.
 *
 * Known limitation: only the root package's `dependencies` are walked (plus
 * transitive `dependencies`/`peerDependencies`). Packages reachable only via
 * the root `devDependencies` or via `optionalDependencies` are not represented
 * in the returned graph.
 */
export const extractDependencyGraph = async (rootDir: string) => {
  log('starting to extract dependency graph...');
  const depGraph: DepGraph = new Map();

  const packageJson = await loadPackage(`${rootDir}/package.json`);

  const deps = Object.keys(packageJson.dependencies ?? {});

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
