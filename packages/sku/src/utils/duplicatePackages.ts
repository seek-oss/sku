import { getWhyCommand } from '@sku-private/utils';
import { accent, banner, caution, strong } from '@sku-private/utils/console';
import { createDebug } from 'obug';
import semver from 'semver';

import { extractDependencyGraph, type DepGraph } from './dependencyGraph.js';
import { shouldSkipValidatePeerDeps } from './skipValidatePeerDeps.js';
import type { LintResult } from './runLintChecks.js';
import provider from '../services/telemetry/index.js';

const debug = createDebug('sku:duplicate-packages');

/**
 * Packages always checked for duplicates, regardless of app configuration.
 * The candidate set is extended at lint time with the app's compile packages
 * (detected `@seek` packages flagged `skuCompilePackage`, sku's defaults, and
 * user-configured `compilePackages`), restoring the coverage the legacy
 * `validatePeerDeps` check had.
 */
const baseWatchedPackages = [
  'react',
  'react-dom',
  'braid-design-system',
  '@vanilla-extract/css',
] as const;

interface DuplicatePackageCopy {
  version: string;
  directory: string;
  /** Dependency chain from the app to this copy, e.g. `['your app', 'lib-a', 'react']` */
  chain: string[];
}

interface DuplicatePackageFinding {
  packageName: string;
  copies: DuplicatePackageCopy[];
  whyCommand: string;
}

interface ReactPairMismatch {
  reactVersions: string[];
  reactDomVersions: string[];
  copies: DuplicatePackageCopy[];
  whyCommand: string;
}

interface SameVersionDuplicate {
  packageName: string;
  version: string;
  directories: string[];
}

interface PeerVersionMismatch {
  /** Package that declares the peer dependency */
  packageName: string;
  packageVersion?: string;
  packageDirectory: string;
  /** Candidate package the peer dependency points at */
  peerName: string;
  peerVersionRange: string;
  /** Version of the peer copy this package copy actually resolves */
  resolvedPeerVersion: string;
  resolvedPeerDirectory: string;
  /** `true` when the resolved peer is ahead of the declared range (the declaring package's range is behind) */
  resolvedPeerIsAhead: boolean;
  chain: string[];
  whyCommand: string;
}

interface DuplicatePackageReport {
  findings: DuplicatePackageFinding[];
  pairMismatch?: ReactPairMismatch;
  peerMismatches: PeerVersionMismatch[];
  sameVersionDuplicates: SameVersionDuplicate[];
}

interface ClassifyOptions {
  whyCommand?: string;
  /**
   * Extra packages to check (e.g. the app's compile packages). Graph entries
   * flagged `skuCompilePackage` are always included as candidates as well.
   */
  candidatePackages?: string[];
}

const ROOT = 'ROOT';

const buildChain = (directory: string, depGraph: DepGraph): string[] => {
  const chain: string[] = [];
  const visited = new Set<string>();
  let current: string | undefined = directory;

  while (current && current !== ROOT && !visited.has(current)) {
    visited.add(current);
    const entry = depGraph.get(current);
    if (!entry) {
      break;
    }
    chain.unshift(entry.name);
    current = entry.dependents[0];
  }

  if (current === ROOT) {
    chain.unshift('your app');
  }

  return chain;
};

type WatchedEntry = { directory: string; version: string };

const getCandidatePackages = (
  depGraph: DepGraph,
  extraCandidates: string[] = [],
) => {
  const candidates = new Set<string>([
    ...baseWatchedPackages,
    ...extraCandidates,
  ]);

  // Any package flagged as a sku compile package in its own `package.json`
  // is a candidate, even if compile-package detection didn't surface it.
  for (const entry of depGraph.values()) {
    if (entry.skuCompilePackage) {
      candidates.add(entry.name);
    }
  }

  return candidates;
};

const groupCandidateEntries = (depGraph: DepGraph, candidates: Set<string>) => {
  const byName = new Map<string, WatchedEntry[]>();

  for (const [directory, entry] of depGraph) {
    if (directory === ROOT || !entry.version) {
      continue;
    }
    if (!candidates.has(entry.name)) {
      continue;
    }
    const list = byName.get(entry.name) ?? [];
    list.push({ directory, version: entry.version });
    byName.set(entry.name, list);
  }

  return byName;
};

const toCopy = (
  depGraph: DepGraph,
  { directory, version }: WatchedEntry,
): DuplicatePackageCopy => ({
  version,
  directory,
  chain: buildChain(directory, depGraph),
});

/**
 * Finds candidate packages whose declared peer dependency on another
 * candidate resolves to a copy outside the declared range, per declaring
 * copy. The `react-dom` → `react` peer is excluded: it is reported by the
 * dedicated react pair check instead.
 */
const findPeerMismatches = (
  depGraph: DepGraph,
  candidates: Set<string>,
  whyCommand: string,
): PeerVersionMismatch[] => {
  const mismatches: PeerVersionMismatch[] = [];
  const seen = new Set<string>();

  for (const [directory, entry] of depGraph) {
    if (directory === ROOT || !candidates.has(entry.name)) {
      continue;
    }

    for (const [peerName, range] of Object.entries(
      entry.peerDependencies ?? {},
    )) {
      if (!candidates.has(peerName)) {
        continue;
      }
      if (entry.name === 'react-dom' && peerName === 'react') {
        continue;
      }
      if (!semver.validRange(range)) {
        continue;
      }

      const resolvedDirectory = entry.resolutions?.[peerName];
      const resolved = resolvedDirectory
        ? depGraph.get(resolvedDirectory)
        : undefined;
      if (
        !resolvedDirectory ||
        !resolved?.version ||
        !semver.valid(resolved.version)
      ) {
        continue;
      }
      if (semver.satisfies(resolved.version, range)) {
        continue;
      }

      const key = `${directory}:${peerName}:${range}:${resolved.version}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);

      mismatches.push({
        packageName: entry.name,
        packageVersion: entry.version,
        packageDirectory: directory,
        peerName,
        peerVersionRange: range,
        resolvedPeerVersion: resolved.version,
        resolvedPeerDirectory: resolvedDirectory,
        resolvedPeerIsAhead: semver.gtr(resolved.version, range),
        chain: buildChain(directory, depGraph),
        whyCommand,
      });
    }
  }

  return mismatches.toSorted((a, b) =>
    `${a.packageName}:${a.peerName}`.localeCompare(
      `${b.packageName}:${b.peerName}`,
    ),
  );
};

/**
 * Pure classifier over a dependency graph. Emits a finding when a candidate
 * package resolves to two or more distinct versions, a pair mismatch when
 * the resolved `react` and `react-dom` version sets differ, and a peer
 * mismatch when a candidate's declared peer range is not satisfied by the
 * peer copy it actually resolves.
 */
export const classifyDuplicatePackages = (
  depGraph: DepGraph,
  { whyCommand = getWhyCommand(), candidatePackages }: ClassifyOptions = {},
): DuplicatePackageReport => {
  const candidates = getCandidatePackages(depGraph, candidatePackages);
  const byName = groupCandidateEntries(depGraph, candidates);
  const findings: DuplicatePackageFinding[] = [];
  const sameVersionDuplicates: SameVersionDuplicate[] = [];

  for (const [packageName, entries] of byName) {
    const byVersion = new Map<string, WatchedEntry[]>();
    for (const entry of entries) {
      const list = byVersion.get(entry.version) ?? [];
      list.push(entry);
      byVersion.set(entry.version, list);
    }

    for (const [version, versionEntries] of byVersion) {
      if (versionEntries.length > 1) {
        const duplicate: SameVersionDuplicate = {
          packageName,
          version,
          directories: versionEntries.map((e) => e.directory),
        };
        sameVersionDuplicates.push(duplicate);
        debug(
          `Multiple directories resolve ${packageName}@${version} (same version, not a finding):`,
          duplicate.directories,
        );
      }
    }

    if (byVersion.size >= 2) {
      findings.push({
        packageName,
        copies: entries
          .map((entry) => toCopy(depGraph, entry))
          .toSorted((a, b) => a.version.localeCompare(b.version)),
        whyCommand,
      });
    }
  }

  findings.sort((a, b) => a.packageName.localeCompare(b.packageName));

  let pairMismatch: ReactPairMismatch | undefined;
  const reactEntries = byName.get('react');
  const reactDomEntries = byName.get('react-dom');

  if (reactEntries && reactDomEntries) {
    const reactVersions = [
      ...new Set(reactEntries.map((e) => e.version)),
    ].toSorted();
    const reactDomVersions = [
      ...new Set(reactDomEntries.map((e) => e.version)),
    ].toSorted();

    if (
      reactVersions.length !== reactDomVersions.length ||
      reactVersions.some((version, i) => version !== reactDomVersions[i])
    ) {
      pairMismatch = {
        reactVersions,
        reactDomVersions,
        copies: [...reactEntries, ...reactDomEntries]
          .map((entry) => toCopy(depGraph, entry))
          .toSorted((a, b) => a.version.localeCompare(b.version)),
        whyCommand,
      };
    }
  }

  return {
    findings,
    pairMismatch,
    peerMismatches: findPeerMismatches(depGraph, candidates, whyCommand),
    sameVersionDuplicates,
  };
};

const formatCopy = ({ version, directory, chain }: DuplicatePackageCopy) =>
  `${strong(version)} at ${directory} (via ${chain.join(' > ')})`;

/**
 * Lint check for duplicate versions of watched packages. Warn-only: it always
 * resolves with `exitCode: 0`, is skipped when the app sets
 * `skuSkipValidatePeerDeps`, and swallows dependency-resolution errors.
 */
interface CheckDuplicatePackagesOptions {
  rootDir?: string;
  /** Extra packages to check, e.g. the app's compile packages from sku context */
  candidatePackages?: string[];
}

export const checkDuplicatePackages = async (
  rootDirOrOptions?: string | CheckDuplicatePackagesOptions,
): Promise<LintResult> => {
  const { rootDir, candidatePackages } =
    typeof rootDirOrOptions === 'string'
      ? { rootDir: rootDirOrOptions, candidatePackages: undefined }
      : (rootDirOrOptions ?? {});
  if (shouldSkipValidatePeerDeps(rootDir)) {
    debug('skuSkipValidatePeerDeps set, skipping duplicate package check');
    return { exitCode: 0 };
  }

  try {
    const depGraph = await extractDependencyGraph(rootDir ?? process.cwd());
    const { findings, pairMismatch, peerMismatches, sameVersionDuplicates } =
      classifyDuplicatePackages(depGraph, { candidatePackages });

    for (const duplicate of sameVersionDuplicates) {
      debug(
        `Same-version duplicate (no warning): ${duplicate.packageName}@${duplicate.version}`,
        duplicate.directories,
      );
    }

    if (findings.length === 0 && !pairMismatch && peerMismatches.length === 0) {
      return { exitCode: 0 };
    }

    const messages: string[] = [];

    for (const finding of findings) {
      provider.count('duplicate_compile_package', {
        compile_package: finding.packageName,
      });
      messages.push(
        [
          `${strong(finding.packageName)} is resolved in your dependency graph at more than one version:`,
          ...finding.copies.map(
            (copy) => `- ${strong(finding.packageName)}@${formatCopy(copy)}`,
          ),
          `Try running "${accent(finding.whyCommand)} ${accent(finding.packageName)}" to diagnose the issue`,
        ].join('\n'),
      );
    }

    if (pairMismatch) {
      provider.count('peer_dep_version_mismatch', {
        compile_package: 'react-dom',
      });
      messages.push(
        [
          `${strong('react')} and ${strong('react-dom')} are resolved in your dependency graph at mismatched versions:`,
          ...pairMismatch.copies.map((copy) => {
            const name = copy.chain.at(-1) ?? 'react';
            return `- ${strong(name)}@${formatCopy(copy)}`;
          }),
          `Try running "${accent(pairMismatch.whyCommand)} ${accent('react')}" and "${accent(pairMismatch.whyCommand)} ${accent('react-dom')}" to diagnose the issue`,
        ].join('\n'),
      );
    }

    for (const mismatch of peerMismatches) {
      provider.count('peer_dep_version_mismatch', {
        compile_package: mismatch.packageName,
      });
      const declarer = mismatch.packageVersion
        ? `${mismatch.packageName}@${mismatch.packageVersion}`
        : mismatch.packageName;
      messages.push(
        [
          `${strong(declarer)} expected to find ${strong(mismatch.peerName)} ${caution(mismatch.peerVersionRange)} but resolved ${caution(mismatch.resolvedPeerVersion)} at ${mismatch.resolvedPeerDirectory} (via ${mismatch.chain.join(' > ')}).`,
          mismatch.resolvedPeerIsAhead
            ? `The best way to fix this is for ${strong(mismatch.packageName)} to update its peer dependency on ${strong(mismatch.peerName)}.`
            : `The best way to fix this is to update your dependency on ${strong(mismatch.peerName)}.`,
          `Try running "${accent(mismatch.whyCommand)} ${accent(mismatch.peerName)}" to diagnose the issue`,
        ].join('\n'),
      );
    }

    banner('caution', 'Warning: Duplicate packages detected', messages);
  } catch (e) {
    debug('Duplicate package check failed, skipping', e);
  }

  return { exitCode: 0 };
};
