import { createPackageResolver } from './resolvePackage.js';

import { cwd } from '@/utils/cwd.js';
import { jest } from '@jest/globals';

describe('webpack utils', () => {
  describe('resolvePackage()', () => {
    let resolvePackage: ReturnType<typeof createPackageResolver>;
    let fs: any; // No idea how to type this properly here. I tried jest.Mocked<> but I couldnt get it to play nice with the readFileSync mock
    let resolve: any; // Same here.

    beforeEach(() => {
      fs = {
        readFileSync: jest.fn(() => '{}'),
      };
      resolve = jest.fn();
      resolvePackage = createPackageResolver(fs, resolve);
    });

    test('defaults to require.resolve', () => {
      resolve.mockReturnValue('./node_modules/test/package.json');
      expect(resolvePackage('test')).toEqual('./node_modules/test');
    });

    test('returns a naive path when require.resolve fails and the package is not a project dependency', () => {
      const error = new Error('Module not found') as Error & { code: string };
      error.code = 'MODULE_NOT_FOUND';
      resolve.mockImplementation(() => {
        throw error;
      });

      expect(resolvePackage('test')).toEqual(`${cwd()}/node_modules/test`);
    });

    test('handles missing package.json when looking for dependencies', () => {
      const resolveError = new Error('Module not found') as Error & {
        code: string;
      };
      resolveError.code = 'MODULE_NOT_FOUND';
      resolve.mockImplementation(() => {
        throw resolveError;
      });

      const packageError = new Error('File not found') as Error & {
        code: string;
      };
      packageError.code = 'ENOENT';
      fs.readFileSync.mockImplementation(() => {
        throw packageError;
      });

      expect(resolvePackage('test')).toEqual(`${cwd()}/node_modules/test`);
    });

    describe('throws when require.resolve fails and the package is listed', () => {
      const resolveError = new Error('Module not found') as Error & {
        code: string;
      };
      resolveError.code = 'MODULE_NOT_FOUND';

      beforeEach(() => {
        resolve.mockImplementation(() => {
          throw resolveError;
        });
      });

      test('in dependencies', () => {
        fs.readFileSync.mockReturnValue(
          JSON.stringify({
            dependencies: {
              test: '1.0.0',
            },
          }),
        );

        expect(() => resolvePackage('test')).toThrow(resolveError);
      });

      test('in devDependencies', () => {
        fs.readFileSync.mockReturnValue(
          JSON.stringify({
            devDependencies: {
              test: '1.0.0',
            },
          }),
        );

        expect(() => resolvePackage('test')).toThrow(resolveError);
      });
    });

    test('caches results', () => {
      resolve.mockReturnValue('./node_modules/test/package.json');

      resolvePackage('test');
      resolvePackage('test');

      expect(resolve).toHaveBeenCalledTimes(1);
    });
  });
});
