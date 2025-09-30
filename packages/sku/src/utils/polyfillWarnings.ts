import { styleText } from 'node:util';
import {
  detectUnnecessaryPolyfills,
  type DetectedPolyfillWithSource,
} from './polyfillDetector.js';
import provider from '../services/telemetry/provider.js';

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
  console.log(styleText('yellow', '⚠️  Unnecessary polyfills detected'));
  console.log();

  console.log(
    styleText('dim', 'The following polyfills may no longer be necessary:'),
  );
  console.log();

  detectedPolyfills.forEach((polyfill) => displayPolyfillWarning(polyfill));

  console.log(
    styleText(
      'dim',
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
    styleText(
      'red',
      `  ❌ ${styleText('bold', polyfill.polyfillName)} ${styleText('dim', `(${sourceText})`)}`,
    ),
  );
  console.log(styleText('dim', `     ${polyfill.reason}`));

  if (polyfill.docsUrl) {
    console.log(styleText('dim', `     Docs: ${polyfill.docsUrl}`));
  }

  // Provide actionable guidance based on detection source
  if (polyfill.detectionSource === 'config') {
    console.log(
      styleText(
        'dim',
        `     Action: Remove from polyfills array in sku.config.ts`,
      ),
    );
  } else {
    console.log(
      styleText(
        'dim',
        `     Action: Remove from ${polyfill.dependencyType} in package.json`,
      ),
    );
  }

  console.log();
};
