import { POLYFILL_REGISTRY } from './polyfillRegistry.js';
import type { DetectedPolyfillWithSource } from './polyfillDetector.js';

/**
 * Detects unnecessary polyfills from the configured polyfills array
 * by matching package names against the registry.
 */
export const detectUnnecessaryPolyfillsFromConfig = (
  polyfills: string[],
): DetectedPolyfillWithSource[] =>
  polyfills
    .filter(
      (polyfillName) =>
        polyfillName in POLYFILL_REGISTRY || polyfillName.startsWith('core-js'),
    )
    .map((polyfillName) => ({
      polyfillName,
      detectionSource: 'config' as const,
      ...(POLYFILL_REGISTRY[polyfillName] || POLYFILL_REGISTRY['core-js']!),
    }));
