import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { cwd, getWhyCommand } from '@sku-private/utils';
import {
  accent,
  accentLight,
  banner,
  caution,
  critical,
  strong,
} from '@sku-private/utils/console';
import { createDebug } from 'obug';
import semver from 'semver';

import {
  extractDependencyGraph,
  ROOT,
  type DepGraph,
  type DepGraphEntry,
} from './dependencyGraph.js';
import type { LintResult } from './runLintChecks.js';
import provider from '../services/telemetry/index.js';

const debug = createDebug('sku:duplicate-packages');

/** Always checked, in addition to any `extraPackages` the caller passes */
const watchlist = [
  'react',
  'react-dom',
  'braid-design-system',
  '@vanilla-extract/css',
];

const semverOptions = { includePrerelease: true };

type PackageCopy = DepGraphEntry & { directory: string; version: string };

/** `react-dom` only works with the exact same version of `react` */
const requiresExactVersion = (name: string, peerName: string) =>
  name === 'react-dom' && peerName === 'react';

/**
 * Finds watched and caller-supplied packages that resolve to more than one
 * version, and copies whose peer dependency on such a package resolves to a
 * version outside the declared range.
 */
export const classifyDuplicatePackages = (
  depGraph: DepGraph,
  { extraPackages = [] }: { extraPackages?: Iterable<string> } = {},
) => {
  const packagesToCheck = new Set([...watchlist, ...extraPackages]);

  const copies = [...depGraph]
    .flatMap(([directory, entry]): PackageCopy[] =>
      entry.version && packagesToCheck.has(entry.name)
        ? [{ ...entry, directory, version: entry.version }]
        : [],
    )
    .sort(
      (a, b) =>
        a.name.localeCompare(b.name) ||
        a.version.localeCompare(b.version, undefined, { numeric: true }) ||
        a.directory.localeCompare(b.directory),
    );
  const copiesByName = Map.groupBy(copies, (copy) => copy.name);

  const duplicates = [...copiesByName.values()].filter(
    (group) => new Set(group.map((copy) => copy.version)).size > 1,
  );

  const versionMismatches = copies.flatMap((copy) =>
    Object.entries(copy.peerDependencies ?? {}).flatMap(([peerName, range]) => {
      const peer = copiesByName
        .get(peerName)
        ?.find((peerCopy) => peerCopy.dependents.includes(copy.directory));
      const expectedRange = requiresExactVersion(copy.name, peerName)
        ? copy.version
        : range;

      if (
        !peer ||
        !expectedRange ||
        !semver.valid(peer.version) ||
        !semver.validRange(expectedRange) ||
        semver.satisfies(peer.version, expectedRange, semverOptions)
      ) {
        return [];
      }

      return [{ copy, peer, expectedRange }];
    }),
  );

  return { duplicates, versionMismatches };
};

/**
 * One dependency path from the app to `directory`. Following `dependents[0]`
 * always leads back to `ROOT`, because it is the package the walk first
 * reached this one through.
 */
const formatChain = (directory: string, depGraph: DepGraph) => {
  const chain: string[] = [];
  for (
    let entry = depGraph.get(directory);
    entry;
    entry = depGraph.get(entry.dependents[0])
  ) {
    chain.unshift(entry.name === ROOT ? 'your app' : entry.name);
  }
  return chain.join(' > ');
};

const formatWhyHint = (packageName: string) =>
  `Try running "${accent(getWhyCommand())} ${accent(packageName)}" to diagnose the issue`;

const formatFixAdvice = (
  copy: PackageCopy,
  peer: PackageCopy,
  expectedRange: string,
) => {
  if (requiresExactVersion(copy.name, peer.name)) {
    return `${strong('react')} and ${strong('react-dom')} must be installed at the same version.`;
  }

  return semver.gtr(peer.version, expectedRange, semverOptions)
    ? `The best way to fix this is for ${strong(copy.name)} to update its peer dependency on ${strong(peer.name)}.`
    : `The best way to fix this is to update your dependency on ${strong(peer.name)}.`;
};

/**
 * Warn-only lint check for duplicate and mismatched package versions.
 */
export const checkDuplicatePackages = async ({
  rootDir = cwd(),
  extraPackages = [],
}: {
  rootDir?: string;
  /** e.g. the app's compile packages */
  extraPackages?: Iterable<string>;
} = {}): Promise<LintResult> => {
  try {
    const { skuSkipValidatePeerDeps } = JSON.parse(
      await readFile(path.join(rootDir, 'package.json'), 'utf-8'),
    );
    if (skuSkipValidatePeerDeps) {
      debug('skuSkipValidatePeerDeps set, skipping duplicate package check');
      return { exitCode: 0 };
    }
    console.log(accentLight(`Checking for dependency issues`));

    const depGraph = await extractDependencyGraph(rootDir, {
      includeDevDependencies: true,
    });
    const { duplicates, versionMismatches } = classifyDuplicatePackages(
      depGraph,
      { extraPackages },
    );
    const messages: string[] = [];

    for (const group of duplicates) {
      const { name } = group[0];
      provider.count('duplicate_compile_package', { compile_package: name });
      messages.push(
        [
          `${strong(name)} is resolved in your dependency graph at more than one version:`,
          ...group.map(
            (copy) =>
              `- ${strong(name)}@${strong(copy.version)} at ${copy.directory} (via ${formatChain(copy.directory, depGraph)})`,
          ),
          formatWhyHint(name),
        ].join('\n'),
      );
    }

    for (const { copy, peer, expectedRange } of versionMismatches) {
      provider.count('peer_dep_version_mismatch', {
        compile_package: copy.name,
      });
      messages.push(
        [
          `${strong(`${copy.name}@${copy.version}`)} expected to find ${strong(peer.name)} ${caution(expectedRange)} but resolved ${caution(peer.version)} at ${peer.directory} (via ${formatChain(copy.directory, depGraph)}).`,
          formatFixAdvice(copy, peer, expectedRange),
          formatWhyHint(peer.name),
        ].join('\n'),
      );
    }

    if (messages.length > 0) {
      banner('caution', 'Warning: Dependency issues detected', messages);
    }
  } catch (e) {
    console.error(critical('Dependency issue check failed:'), e);
  }

  return { exitCode: 0 };
};
