import type { PolyfillRegistryEntry } from './polyfillRegistry.js';
import { detectUnnecessaryPolyfillsFromDependencies } from './detectUnnecessaryPolyfillsFromDependencies.js';
import { detectUnnecessaryPolyfillsFromConfig } from './detectUnnecessaryPolyfillsFromConfig.js';

export interface DetectedPolyfillWithSource extends PolyfillRegistryEntry {
  polyfillName: string;
  detectionSource: 'config' | 'dependency';
  dependencyType?: 'dependencies' | 'devDependencies';
}

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
