import { readFileSync, existsSync } from 'node:fs';
import { getPathFromCwd } from '@sku-lib/utils';
import { POLYFILL_REGISTRY } from './polyfillRegistry.js';
import type { DetectedPolyfillWithSource } from './polyfillDetector.js';

/**
 * Detects unnecessary polyfills from package.json dependencies
 * by matching package names against the registry.
 */
export const detectUnnecessaryPolyfillsFromDependencies =
  (): DetectedPolyfillWithSource[] => {
    const packageJsonPath = getPathFromCwd('package.json');

    if (!existsSync(packageJsonPath)) {
      return [];
    }

    try {
      const packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageJsonContent);

      const dependencies = packageJson.dependencies || {};
      const devDependencies = packageJson.devDependencies || {};

      const detectedPolyfills: DetectedPolyfillWithSource[] = [];

      // Check dependencies
      for (const depName of Object.keys(dependencies)) {
        if (depName in POLYFILL_REGISTRY || depName.startsWith('core-js')) {
          detectedPolyfills.push({
            polyfillName: depName,
            detectionSource: 'dependency',
            dependencyType: 'dependencies',
            ...(POLYFILL_REGISTRY[depName] || POLYFILL_REGISTRY['core-js']!),
          });
        }
      }

      // Check devDependencies
      for (const depName of Object.keys(devDependencies)) {
        if (depName in POLYFILL_REGISTRY || depName.startsWith('core-js')) {
          detectedPolyfills.push({
            polyfillName: depName,
            detectionSource: 'dependency',
            dependencyType: 'devDependencies',
            ...(POLYFILL_REGISTRY[depName] || POLYFILL_REGISTRY['core-js']!),
          });
        }
      }

      return detectedPolyfills;
    } catch {
      // If we can't read or parse package.json, return empty array
      return [];
    }
  };
