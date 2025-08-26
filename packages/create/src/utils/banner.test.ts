import { describe, it, vi, beforeEach, afterEach } from 'vitest';
import { banner } from './banner.js';

describe('banner', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should display info banner with correct icon and spacing', ({
    expect,
  }) => {
    banner('info', 'Test Message');

    expect(consoleSpy).toHaveBeenCalledWith();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('ℹ️  Test Message'),
    );
    expect(consoleSpy).toHaveBeenCalledWith();
  });

  it('should display success banner with correct icon', ({ expect }) => {
    banner('success', 'Success Message');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('✅  Success Message'),
    );
  });

  it('should display error banner with correct icon', ({ expect }) => {
    banner('error', 'Error Message');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('❌  Error Message'),
    );
  });
});
