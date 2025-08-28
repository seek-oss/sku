import { describe, it } from 'vitest';

const toPosixPath = (await import('./toPosixPath.js')).default;

describe('toPosixPath', () => {
  it('should leave posix paths unchanged', ({ expect }) => {
    const posixPath = '/foo/bar/baz';

    const result = toPosixPath(posixPath);

    expect(result).toBe('/foo/bar/baz');
  });

  it('should convert windows backslashes to forward slashes', ({ expect }) => {
    const windowsPath = 'C:\\Users\\name\\Documents';

    const result = toPosixPath(windowsPath);

    expect(result).toBe('C:/Users/name/Documents');
  });

  it('should handle mixed path separators', ({ expect }) => {
    const mixedPath = 'C:\\Users/name\\Documents/file.txt';

    const result = toPosixPath(mixedPath);

    expect(result).toBe('C:/Users/name/Documents/file.txt');
  });

  it('should handle relative windows paths', ({ expect }) => {
    const relativePath = '..\\parent\\folder\\file.js';

    const result = toPosixPath(relativePath);

    expect(result).toBe('../parent/folder/file.js');
  });

  it('should handle single backslash', ({ expect }) => {
    const singleBackslash = 'folder\\file.txt';

    const result = toPosixPath(singleBackslash);

    expect(result).toBe('folder/file.txt');
  });

  it('should handle empty string', ({ expect }) => {
    const emptyPath = '';

    const result = toPosixPath(emptyPath);

    expect(result).toBe('');
  });

  it('should handle path with only backslashes', ({ expect }) => {
    const backslashPath = '\\\\server\\share';

    const result = toPosixPath(backslashPath);

    expect(result).toBe('//server/share');
  });
});
