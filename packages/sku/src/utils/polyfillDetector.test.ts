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
            "reason": "Most ES2015-ES2017 features are natively supported in modern browsers",
          },
          {
            "docsUrl": "https://babeljs.io/docs/en/babel-polyfill",
            "polyfillName": "@babel/polyfill",
            "reason": "Deprecated package, replaced by core-js",
          },
          {
            "polyfillName": "whatwg-fetch",
            "reason": "Fetch API is natively supported in modern browsers",
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
            "reason": "Most ES2015-ES2017 features are natively supported in modern browsers",
          },
          {
            "docsUrl": "https://github.com/zloirock/core-js#usage",
            "polyfillName": "core-js/es6",
            "reason": "Most ES2015-ES2017 features are natively supported in modern browsers",
          },
          {
            "docsUrl": "https://github.com/zloirock/core-js#usage",
            "polyfillName": "core-js/features/promise",
            "reason": "Most ES2015-ES2017 features are natively supported in modern browsers",
          },
        ]
      `);
    });
  });
});
