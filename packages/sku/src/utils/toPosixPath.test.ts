import { describe, it } from 'vitest';

/**
 * @jest-environment node
 */

import toPosixPath from './toPosixPath.js';

describe('toPosixPath', () => {
  it('should leave a posix path as-is', ({ expect }) => {
    const inputPath = '/foo/bar/123';

    expect(toPosixPath(inputPath)).toBe(inputPath);
  });

  it('should convert windows paths to posix paths', ({ expect }) => {
    const inputPath = 'D:\\foo\\bar\\123';

    expect(toPosixPath(inputPath)).toBe('D:/foo/bar/123');
  });
});
