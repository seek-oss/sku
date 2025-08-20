import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs/promises';
import resolveSync from 'resolve-from';

import type { PackageJson } from 'type-fest';
import debug from 'debug';

const log = debug('sku:dependency-graph');

export const resolveFrom = async (fromDirectory: string, moduleId: string) =>
  resolveSync(fromDirectory, moduleId);

const ROOT = 'ROOT';

const promiseMap = async <T, K>(
  items: T[],
  fn: (item: T) => Promise<K>,
): Promise<K[]> => Promise.all(items.map(fn));

interface Dependency {
  version: PackageJson['version'];
  dependents: string[];
  dependencies: string[];
  peerDependencies: string[];
}

type DepGraph = Map<string, Dependency>;

const loadPackage = async (packageJsonPath: string) =>
  fs
    .readFile(packageJsonPath, 'utf-8')
    .then(JSON.parse) as Promise<PackageJson>;

const anaylyseDependency = async (
  dependent: string,
  dep: string,
  rootDir: string,
  depGraph: DepGraph,
) => {
  const packageJsonPath = await resolveFrom(rootDir, `${dep}/package.json`);
  const packageJson = await loadPackage(packageJsonPath);

  const dependencies = Object.keys(packageJson.dependencies ?? {});
  const peerDependencies = Object.keys(packageJson.peerDependencies ?? {});

  const dependency = depGraph.get(dep);

  if (dependency) {
    if (dependency.version !== packageJson.version) {
      throw new Error(
        `Found dependency "${dep}" with multiple versions:\n${JSON.stringify(
          dependency,
          null,
          2,
        )}\n${JSON.stringify({
          version: packageJson.version,
          dependencies,
        })}`,
      );
    }

    dependency.dependents.push(dependent);
  } else {
    depGraph.set(dep, {
      version: packageJson.version,
      dependents: [dependent],
      dependencies,
      peerDependencies,
    });

    await promiseMap(
      [...dependencies, ...peerDependencies],
      async (childDep) => {
        try {
          await anaylyseDependency(
            dep,
            childDep,
            path.dirname(packageJsonPath),
            depGraph,
          );
        } catch (e) {
          log(`Error analysing dependency ${childDep} for ${dep}.`, e);
        }
      },
    );
  }
};

export const extractDependencyGraph = async (rootDir: string) => {
  log('starting to extract dependency graph...');
  const depGraph: DepGraph = new Map();

  const packageJson = await loadPackage(`${rootDir}/package.json`);

  const deps = Object.keys(packageJson.dependencies ?? {});

  const dependency: Dependency = {
    version: packageJson.version,
    dependents: [],
    dependencies: deps,
    peerDependencies: [],
  };

  depGraph.set(ROOT, dependency);

  await promiseMap(deps, async (childDep) => {
    try {
      await anaylyseDependency(ROOT, childDep, rootDir, depGraph);
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
  const dependency = depGraph.get(depName);

  if (!dependency) {
    return {
      noExternal: [],
    };
  }

  const noExternals = new Set<string>();
  const dependents = new Set(dependency.dependents);

  for (const dependentName of dependents) {
    const dependent = depGraph.get(dependentName);
    assert(dependent);

    noExternals.add(dependentName);
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
