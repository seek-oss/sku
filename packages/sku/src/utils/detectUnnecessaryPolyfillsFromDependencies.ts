import { readFileSync } from 'node:fs';
import { getPathFromCwd } from '@sku-private/utils';
import {
  type DetectedPolyfillWithSource,
  getDeprecatedPolyfill,
} from './polyfillDetector.js';

/**
 * Detects unnecessary polyfills from package.json dependencies
 * by matching package names against the registry.
 */
export const detectUnnecessaryPolyfillsFromDependencies =
  (): DetectedPolyfillWithSource[] => {
    const packageJsonPath = getPathFromCwd('package.json');

    try {
      const packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageJsonContent);

      const dependencies = packageJson.dependencies || {};
      const devDependencies = packageJson.devDependencies || {};

      const detectedPolyfills: DetectedPolyfillWithSource[] = [];

      for (const [dependencyType, deps] of Object.entries({
        dependencies,
        devDependencies,
      })) {
        for (const depName of Object.keys(deps)) {
          const polyfill = getDeprecatedPolyfill(depName);
          if (!polyfill) {
            continue;
          }

          detectedPolyfills.push({
            polyfillName: depName,
            detectionSource: 'dependency',
            dependencyType: dependencyType as
              | 'dependencies'
              | 'devDependencies',
            ...polyfill,
          });
        }
      }

      return detectedPolyfills;
    } catch (error) {
      throw new Error(
        `Failed to read or parse package.json at ${packageJsonPath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  };
