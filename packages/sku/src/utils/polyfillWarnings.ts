import {
  detectUnnecessaryPolyfills,
  type DetectedPolyfillWithSource,
} from './polyfillDetector.js';
import provider from '../services/telemetry/index.js';
import {
  caution,
  critical,
  secondary,
  strong,
} from '@sku-private/utils/console';

/**
 * Validates and displays warnings for unnecessary polyfills in a clean, formatted way
 */
export const validatePolyfills = (polyfills: string[]): void => {
  const detectedPolyfills = detectUnnecessaryPolyfills(polyfills);

  if (detectedPolyfills.length === 0) {
    return;
  }

  provider.count('unnecessary_polyfill', undefined, detectedPolyfills.length);

  console.log();
  console.log(caution('⚠️  Unnecessary polyfills detected'));
  console.log();

  console.log(secondary('The following polyfills may no longer be necessary:'));
  console.log();

  detectedPolyfills.forEach((polyfill) => displayPolyfillWarning(polyfill));

  console.log(
    secondary(
      '💡 Consider removing these polyfills to reduce your bundle size.',
    ),
  );
  console.log();
};

const displayPolyfillWarning = (polyfill: DetectedPolyfillWithSource): void => {
  const sourceText =
    polyfill.detectionSource === 'config'
      ? 'found in config'
      : `found in ${polyfill.dependencyType}`;

  console.log(
    critical(
      `  ❌ ${strong(polyfill.polyfillName)} ${secondary(`(${sourceText})`)}`,
    ),
  );
  console.log(secondary(`     ${polyfill.reason}`));

  if (polyfill.docsUrl) {
    console.log(secondary(`     Docs: ${polyfill.docsUrl}`));
  }

  // Provide actionable guidance based on detection source
  if (polyfill.detectionSource === 'config') {
    console.log(
      secondary(`     Action: Remove from polyfills array in sku.config.ts`),
    );
  } else {
    console.log(
      secondary(
        `     Action: Remove from ${polyfill.dependencyType} in package.json`,
      ),
    );
  }

  console.log();
};
