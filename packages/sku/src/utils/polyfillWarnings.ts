import { styleText } from 'node:util';
import type { DetectedPolyfill } from './polyfillDetector.js';

/**
 * Displays warnings for unnecessary polyfills in a clean, formatted way
 */
export const displayPolyfillWarnings = (
  detectedPolyfills: DetectedPolyfill[],
): void => {
  if (detectedPolyfills.length === 0) {
    return;
  }

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

const displayPolyfillWarning = (polyfill: DetectedPolyfill): void => {
  console.log(
    styleText('red', `  ❌ ${styleText('bold', polyfill.polyfillName)}`),
  );
  console.log(styleText('dim', `     ${polyfill.reason}`));

  if (polyfill.docsUrl) {
    console.log(styleText('dim', `     Docs: ${polyfill.docsUrl}`));
  }

  console.log();
};
