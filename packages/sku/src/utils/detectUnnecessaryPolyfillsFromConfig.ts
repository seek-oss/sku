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
  polyfills.reduce<DetectedPolyfillWithSource[]>((acc, polyfillName) => {
    const polyfillRegistryEntry = getDeprecatedPolyfill(polyfillName);

    if (polyfillRegistryEntry) {
      acc.push({
        polyfillName,
        detectionSource: 'config',
        ...polyfillRegistryEntry,
      });
    }

    return acc;
  }, []);
