import { describe, it, vi } from 'vitest';

const mockReaddirSync = vi.fn();

vi.mock('node:fs', () => ({
  readdirSync: mockReaddirSync,
}));

const { isEmptyDir } = await import('./isEmptyDir.js');

describe('isEmptyDir', () => {
  it('should return true for empty directory', ({ expect }) => {
    mockReaddirSync.mockReturnValue([]);

    const result = isEmptyDir('/empty/dir');

    expect(result).toBe(true);
    expect(mockReaddirSync).toHaveBeenCalledWith('/empty/dir');
  });

  it('should return false for directory with files', ({ expect }) => {
    mockReaddirSync.mockReturnValue(['file1.txt', 'file2.js']);

    const result = isEmptyDir('/non-empty/dir');

    expect(result).toBe(false);
    expect(mockReaddirSync).toHaveBeenCalledWith('/non-empty/dir');
  });

  it('should return false for directory with hidden files', ({ expect }) => {
    mockReaddirSync.mockReturnValue(['.gitignore', '.env']);

    const result = isEmptyDir('/dir/with/hidden');

    expect(result).toBe(false);
  });

  it('should return true when directory does not exist', ({ expect }) => {
    mockReaddirSync.mockImplementation(() => {
      throw new Error('ENOENT: no such file or directory');
    });

    const result = isEmptyDir('/non-existent/dir');

    expect(result).toBe(true);
  });

  it('should return true when access is denied', ({ expect }) => {
    mockReaddirSync.mockImplementation(() => {
      throw new Error('EACCES: permission denied');
    });

    const result = isEmptyDir('/permission/denied');

    expect(result).toBe(true);
  });
});
