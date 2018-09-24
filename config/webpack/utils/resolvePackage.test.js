const { createPackageResolver } = require('./resolvePackage');

describe('webpack utils', () => {
  describe('resolvePackage()', () => {
    let resolvePackage, fs, resolve;

    beforeEach(() => {
      fs = {
        existsSync: jest.fn(),
        readFileSync: jest.fn(() => '{}')
      };
      resolve = jest.fn();
      resolvePackage = createPackageResolver(fs, resolve);
    });

    describe('resolves to ./node_modules', () => {
      const localPath = `${process.cwd()}/node_modules/test`;

      test('when it exists', () => {
        // Local package is found
        fs.existsSync.mockReturnValue(true);

        expect(resolvePackage('test')).toEqual(localPath);
        expect(fs.existsSync).toHaveBeenCalledWith(localPath);
      });

      test('when the package is not a dependency', () => {
        // Local package is not found is not listed in deps (see default fs.readFileSync mock).
        fs.existsSync.mockReturnValue(false);

        expect(resolvePackage('test')).toEqual(localPath);
        expect(fs.existsSync).toHaveBeenCalledWith(localPath);
      });

      test('when ./package.json does not exist', () => {
        // Local package is not found is not listen in deps (see default fs.readFileSync mock).
        fs.existsSync.mockReturnValue(false);
        const error = new Error('File not found');
        error.code = 'ENOENT';
        fs.readFileSync.mockImplementation(() => {
          throw error;
        });

        expect(resolvePackage('test')).toEqual(localPath);
        expect(fs.existsSync).toHaveBeenCalledWith(localPath);
      });
    });

    describe('uses require.resolve', () => {
      const resolvedPackage = 'path/to/node_modules/test';

      beforeEach(() => {
        // Local package does not exist
        fs.existsSync.mockReturnValue(false);
        // require.resolve succeeds
        resolve.mockReturnValue(`${resolvedPackage}/package.json`);
      });

      test('when listed in dependencies', () => {
        fs.readFileSync.mockReturnValue(
          JSON.stringify({
            dependencies: {
              test: '1.0.0'
            }
          })
        );

        expect(resolvePackage('test')).toEqual(resolvedPackage);
        expect(resolve).toHaveBeenCalledWith('test/package.json');
      });

      test('when listed in devDependencies', () => {
        fs.readFileSync.mockReturnValue(
          JSON.stringify({
            devDependencies: {
              test: '1.0.0'
            }
          })
        );

        expect(resolvePackage('test')).toEqual(resolvedPackage);
        expect(resolve).toHaveBeenCalledWith('test/package.json');
      });
    });

    test('throws for missing package', () => {
      // The package is listed as a depenency
      fs.readFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            test: '1.0.0'
          }
        })
      );

      // Local package not found
      fs.existsSync.mockReturnValue(false);

      // require.resolve fails
      const error = new Error('Module not found');
      error.code = 'MODULE_NOT_FOUND';
      resolve.mockImplementation(() => {
        throw error;
      });

      expect(() => resolvePackage('test')).toThrowError('Module not found');
    });

    test('it caches results', () => {
      fs.existsSync.mockReturnValue(true);

      resolvePackage('test');
      resolvePackage('test');

      expect(fs.existsSync).toHaveBeenCalledTimes(1);
    });
  });
});
