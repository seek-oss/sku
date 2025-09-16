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
  polyfills.flatMap((polyfillName) => {
    const registryEntry = POLYFILL_REGISTRY[polyfillName];

    if (!registryEntry) {
      return [];
    }

    return [
      {
        polyfillName,
        ...registryEntry,
      },
    ];
  });
