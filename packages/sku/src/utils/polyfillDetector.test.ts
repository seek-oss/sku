import { describe, it, vi, beforeEach } from 'vitest';
import { detectUnnecessaryPolyfills } from './polyfillDetector.js';

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

describe('polyfillDetector', () => {
  beforeEach(async () => {
    const { existsSync, readFileSync } = await import('node:fs');
    // Default mock: package.json exists but has no polyfill dependencies
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue(
      JSON.stringify({ dependencies: {}, devDependencies: {} }),
    );
  });

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
            "detectionSource": "config",
            "docsUrl": "https://github.com/zloirock/core-js#usage",
            "polyfillName": "core-js",
            "reason": "Polyfills many features that may be unnecessary. Consider removing or using targeted polyfills for specific APIs.",
          },
          {
            "detectionSource": "config",
            "docsUrl": "https://babeljs.io/docs/en/babel-polyfill",
            "polyfillName": "@babel/polyfill",
            "reason": "Deprecated package",
          },
          {
            "detectionSource": "config",
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
            "detectionSource": "config",
            "docsUrl": "https://github.com/zloirock/core-js#usage",
            "polyfillName": "core-js/stable",
            "reason": "Polyfills many features that may be unnecessary. Consider removing or using targeted polyfills for specific APIs.",
          },
          {
            "detectionSource": "config",
            "docsUrl": "https://github.com/zloirock/core-js#usage",
            "polyfillName": "core-js/es6",
            "reason": "Polyfills many features that may be unnecessary. Consider removing or using targeted polyfills for specific APIs.",
          },
          {
            "detectionSource": "config",
            "docsUrl": "https://github.com/zloirock/core-js#usage",
            "polyfillName": "core-js/features/promise",
            "reason": "Polyfills many features that may be unnecessary. Consider removing or using targeted polyfills for specific APIs.",
          },
        ]
      `);
    });

    it('should detect unnecessary polyfills from package.json dependencies', async ({
      expect,
    }) => {
      const mockPackageJson = {
        dependencies: {
          'core-js': '^3.0.0',
          react: '^18.0.0', // non-polyfill
        },
        devDependencies: {
          'whatwg-fetch': '^3.0.0',
          jest: '^29.0.0', // non-polyfill
        },
      };

      const { existsSync, readFileSync } = await import('node:fs');
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackageJson));

      const result = detectUnnecessaryPolyfills([]);

      expect(result).toHaveLength(2);
      expect(
        result.find(
          (p) =>
            p.polyfillName === 'core-js' && p.detectionSource === 'dependency',
        ),
      ).toBeTruthy();
      expect(
        result.find(
          (p) =>
            p.polyfillName === 'whatwg-fetch' &&
            p.detectionSource === 'dependency',
        ),
      ).toBeTruthy();

      vi.clearAllMocks();
    });
  });
});
