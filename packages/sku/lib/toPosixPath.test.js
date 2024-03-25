/**
 * @jest-environment node
 */

const toPosixPath = require('./toPosixPath');

describe('toPosixPath', () => {
  it('should leave a posix path as-is', () => {
    const inputPath = '/foo/bar/123';

    expect(toPosixPath(inputPath)).toBe(inputPath);
  });

  it('should convert windows paths to posix paths', () => {
    const inputPath = 'D:\\foo\\bar\\123';

    expect(toPosixPath(inputPath)).toBe('D:/foo/bar/123');
  });
});
