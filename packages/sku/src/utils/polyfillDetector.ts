import {
  POLYFILL_REGISTRY,
  type PolyfillRegistryEntry,
} from './polyfillRegistry.js';

export interface DetectedPolyfill extends PolyfillRegistryEntry {
  polyfillName: string;
}

/**
 * Detects unnecessary polyfills from the configured polyfills array
 * by matching package names against the registry.
 */
export const detectUnnecessaryPolyfills = (
  polyfills: string[],
): DetectedPolyfill[] =>
  polyfills
    .filter((polyfillName) => polyfillName in POLYFILL_REGISTRY)
    .map((polyfillName) => ({
      polyfillName,
      ...POLYFILL_REGISTRY[polyfillName]!,
    }));
