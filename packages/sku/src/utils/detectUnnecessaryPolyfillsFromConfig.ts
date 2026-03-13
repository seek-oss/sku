import {
  type DetectedPolyfillWithSource,
  getDeprecatedPolyfill,
} from './polyfillDetector.js';

/**
 * Detects unnecessary polyfills from the configured polyfills array
 * by matching package names against the registry.
 */
export const detectUnnecessaryPolyfillsFromConfig = (
  polyfills: string[],
): DetectedPolyfillWithSource[] =>
  polyfills
    .map((polyfillName) => {
      const polyfillRegistryEntry = getDeprecatedPolyfill(polyfillName);
      if (!polyfillRegistryEntry) {
        return;
      }

      return {
        polyfillName,
        detectionSource: 'config',
        ...polyfillRegistryEntry,
      };
    })
    .filter((item): item is DetectedPolyfillWithSource => Boolean(item));
