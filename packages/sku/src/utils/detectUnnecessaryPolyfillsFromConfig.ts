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
    .filter((polyfillName) => getDeprecatedPolyfill(polyfillName))
    .map((polyfillName) => ({
      polyfillName,
      detectionSource: 'config' as const,
      ...getDeprecatedPolyfill(polyfillName)!,
    }));
