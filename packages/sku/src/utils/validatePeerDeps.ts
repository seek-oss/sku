import {
  getWhyCommand,
  isPnpm,
} from '@/services/packageManager/packageManager.js';

import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { fdir as Fdir } from 'fdir';
import semver from 'semver';
import chalk from 'chalk';

import banner from '@/utils/banners/banner.js';
import provider from '@/services/telemetry/index.js';

import { getPathFromCwd } from '@/utils/cwd.js';
import type { SkuContext } from '@/context/createSkuContext.js';

const asyncMap = (
  list: unknown[],
  fn: (item: any) => unknown | Promise<unknown>,
) => Promise.all(list.map((item) => fn(item)));

const singletonPackages = ['@vanilla-extract/css'];

const validatePeerDeps = async ({ paths }: SkuContext) => {
  if (isPnpm) {
    // pnpm doesn't nest dependencies in the same way as yarn or npm, so the method used below won't
    // work for detecting duplicate packages
    return;
  }

  try {
    const duplicatePackages: string[] = [];
    const packagesToCheck = [...paths.compilePackages, ...singletonPackages];

    const packagePatterns = packagesToCheck.map((packageName) => [
      packageName,
      `node_modules/${packageName}/package.json`,
    ]);

    const patterns = packagePatterns.map(([, pattern]) => pattern);

    const results = await new Fdir()
      .withBasePath()
      .filter((file) => patterns.some((pattern) => file.endsWith(pattern)))
      .crawl('./node_modules')
      .withPromise();

    for (const [packageName, pattern] of packagePatterns) {
      const resultsForPackage = results.filter((result) =>
        result.endsWith(pattern),
      );

      if (resultsForPackage.length > 1) {
        const messages = [
          `Multiple copies of ${chalk.bold(packageName)} are present in node_modules. This is likely to cause errors, but even if it works, it will probably result in an unnecessarily large bundle size.`,
        ];

        messages.push(
          resultsForPackage
            .map((depLocation) => {
              const { version } = JSON.parse(
                readFileSync(getPathFromCwd(depLocation), 'utf8'),
              );

              return `${depLocation.replace(
                '/package.json',
                '',
              )} (${chalk.bold(version)})`;
            })
            .join('\n'),
        );

        messages.push(
          `Try running "${chalk.blue.bold(getWhyCommand())} ${chalk.bold(packageName)}" to diagnose the issue`,
        );

        provider.count('duplicate_compile_package', {
          compile_package: packageName,
        });
        banner('error', 'Error: Duplicate packages detected', messages);

        duplicatePackages.push(...resultsForPackage);
      }
    }

    const compilePackages = new Map();

    await asyncMap(duplicatePackages, async (p: string) => {
      const contents = await readFile(getPathFromCwd(p), {
        encoding: 'utf8',
      });

      const { name, version, peerDependencies = {} } = JSON.parse(contents);

      const peers = new Map();

      Object.keys(peerDependencies)
        .filter((dep) => paths.compilePackages.includes(dep))
        .forEach((dep) => {
          peers.set(dep, peerDependencies[dep]);
        });

      compilePackages.set(name, { version, p, peers });
    });

    for (const [packageName, { peers }] of compilePackages.entries()) {
      for (const [peerName, peerVersionRange] of peers.entries()) {
        const dep = compilePackages.get(peerName);

        if (dep && !semver.satisfies(dep.version, peerVersionRange)) {
          provider.count('peer_dep_version_mismatch', {
            compile_package: packageName,
          });

          const peerIsBehind = semver.gtr(dep.version, peerVersionRange);

          const errorMessage = `${chalk.bold(packageName)} expected to find ${chalk.bold(peerName)} ${chalk.yellow(peerVersionRange)} but found ${chalk.yellow(dep.version)}.`;

          const peerBehindMessage = `The best way to fix this is for ${chalk.bold(packageName)} to update its peer dependency on ${chalk.bold(peerName)}.`;

          const peerAheadMessage = `The best way to fix this is to update your dependency on ${chalk.bold(peerName)}.`;

          banner('warning', 'Warning: Package version mismatch', [
            errorMessage,
            peerIsBehind ? peerBehindMessage : peerAheadMessage,
          ]);
        }
      }
    }
  } catch (e) {
    console.log('Error validating peer dependencies');
    console.error(e);
  }
};

export default validatePeerDeps;
