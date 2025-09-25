import {
  type PolyfillRegistryEntry,
  POLYFILL_REGISTRY,
} from './polyfillRegistry.js';
import { detectUnnecessaryPolyfillsFromDependencies } from './detectUnnecessaryPolyfillsFromDependencies.js';
import { detectUnnecessaryPolyfillsFromConfig } from './detectUnnecessaryPolyfillsFromConfig.js';

export interface DetectedPolyfillWithSource extends PolyfillRegistryEntry {
  polyfillName: string;
  detectionSource: 'config' | 'dependency';
  dependencyType?: 'dependencies' | 'devDependencies';
}

/**
 * Gets the polyfill registry entry for a given polyfill name, or null if not deprecated
 */
export const getDeprecatedPolyfill = (
  polyfillName: string,
): PolyfillRegistryEntry | null => {
  if (polyfillName in POLYFILL_REGISTRY) {
    return POLYFILL_REGISTRY[polyfillName];
  }

  if (polyfillName.startsWith('core-js')) {
    return POLYFILL_REGISTRY['core-js']!;
  }

  return null;
};

/**
 * Detects unnecessary polyfills from both config and dependencies
 * by matching package names against the registry.
 */
export const detectUnnecessaryPolyfills = (
  polyfills: string[],
): DetectedPolyfillWithSource[] => {
  const configPolyfills = detectUnnecessaryPolyfillsFromConfig(polyfills);
  const dependencyPolyfills = detectUnnecessaryPolyfillsFromDependencies();

  const polyfillMap = new Map<string, DetectedPolyfillWithSource>();

  // Add dependency polyfills
  dependencyPolyfills.forEach((polyfill) =>
    polyfillMap.set(polyfill.polyfillName, polyfill),
  );

  // Add config polyfills
  configPolyfills.forEach((polyfill) =>
    polyfillMap.set(polyfill.polyfillName, polyfill),
  );

  return Array.from(polyfillMap.values());
};
