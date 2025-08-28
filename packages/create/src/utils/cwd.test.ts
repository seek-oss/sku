import { describe, it, beforeEach } from 'vitest';

const { setCwd, getCwd, getPathFromCwd } = await import('./cwd.js');

describe('cwd', () => {
  const originalCwd = process.cwd();

  beforeEach(() => {
    setCwd(originalCwd);
  });

  describe('setCwd and getCwd', () => {
    it('should set and get the current working directory', ({ expect }) => {
      const testDir = '/test/directory';

      setCwd(testDir);

      expect(getCwd()).toBe(testDir);
    });

    it('should start with process.cwd() by default', ({ expect }) => {
      expect(getCwd()).toBe(originalCwd);
    });

    it('should update cwd when called multiple times', ({ expect }) => {
      setCwd('/first/dir');
      expect(getCwd()).toBe('/first/dir');

      setCwd('/second/dir');
      expect(getCwd()).toBe('/second/dir');
    });
  });

  describe('getPathFromCwd', () => {
    it('should join file path with current working directory', ({ expect }) => {
      setCwd('/project/root');

      const result = getPathFromCwd('src/App.js');

      expect(result).toBe('/project/root/src/App.js');
    });

    it('should handle absolute paths', ({ expect }) => {
      setCwd('/project/root');

      const result = getPathFromCwd('/absolute/path/file.js');

      expect(result).toBe('/project/root/absolute/path/file.js');
    });

    it('should handle relative paths with dots', ({ expect }) => {
      setCwd('/project/root');

      const result = getPathFromCwd('./src/utils/helper.js');

      expect(result).toBe('/project/root/src/utils/helper.js');
    });

    it('should handle empty file path', ({ expect }) => {
      setCwd('/project/root');

      const result = getPathFromCwd('');

      expect(result).toBe('/project/root');
    });

    it('should use updated cwd when cwd changes', ({ expect }) => {
      setCwd('/first/dir');
      const firstResult = getPathFromCwd('file.js');
      expect(firstResult).toBe('/first/dir/file.js');

      setCwd('/second/dir');
      const secondResult = getPathFromCwd('file.js');
      expect(secondResult).toBe('/second/dir/file.js');
    });
  });
});
