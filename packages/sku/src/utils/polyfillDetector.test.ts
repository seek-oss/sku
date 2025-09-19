import { describe, it } from 'vitest';
import { detectUnnecessaryPolyfills } from './polyfillDetector.js';

describe('polyfillDetector', () => {
  describe('detectUnnecessaryPolyfills', () => {
    it('should detect unnecessary polyfills from the registry', ({
      expect,
    }) => {
      const polyfills = [
        'core-js',
        '@babel/polyfill',
        'whatwg-fetch',
        'some-unknown-polyfill',
      ];

      const result = detectUnnecessaryPolyfills(polyfills);

      expect(result).toHaveLength(3);
      expect(result).toMatchInlineSnapshot(`
        [
          {
            "docsUrl": "https://github.com/zloirock/core-js#usage",
            "polyfillName": "core-js",
            "reason": "Polyfills many features that may be unnecessary. Consider removing or using targeted polyfills for specific APIs.",
          },
          {
            "docsUrl": "https://babeljs.io/docs/en/babel-polyfill",
            "polyfillName": "@babel/polyfill",
            "reason": "Deprecated package",
          },
          {
            "polyfillName": "whatwg-fetch",
            "reason": "Fetch API is well established and works across many devices and browser versions. It has been available across browsers since March 2017.",
          },
        ]
      `);
    });

    it('should return empty array when no unnecessary polyfills are found', ({
      expect,
    }) => {
      const polyfills = ['some-unknown-polyfill', 'another-unknown-polyfill'];

      const result = detectUnnecessaryPolyfills(polyfills);

      expect(result).toHaveLength(0);
    });

    it('should handle empty polyfills array', ({ expect }) => {
      const polyfills: string[] = [];

      const result = detectUnnecessaryPolyfills(polyfills);

      expect(result).toHaveLength(0);
    });

    it('should detect core-js prefix variants', ({ expect }) => {
      const polyfills = [
        'core-js/stable',
        'core-js/es6',
        'core-js/features/promise',
      ];

      const result = detectUnnecessaryPolyfills(polyfills);

      expect(result).toHaveLength(3);
      expect(result).toMatchInlineSnapshot(`
        [
          {
            "docsUrl": "https://github.com/zloirock/core-js#usage",
            "polyfillName": "core-js/stable",
            "reason": "Polyfills many features that may be unnecessary. Consider removing or using targeted polyfills for specific APIs.",
          },
          {
            "docsUrl": "https://github.com/zloirock/core-js#usage",
            "polyfillName": "core-js/es6",
            "reason": "Polyfills many features that may be unnecessary. Consider removing or using targeted polyfills for specific APIs.",
          },
          {
            "docsUrl": "https://github.com/zloirock/core-js#usage",
            "polyfillName": "core-js/features/promise",
            "reason": "Polyfills many features that may be unnecessary. Consider removing or using targeted polyfills for specific APIs.",
          },
        ]
      `);
    });
  });
});
