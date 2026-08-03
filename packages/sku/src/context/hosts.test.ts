import { describe, beforeEach, afterEach, it, vi, expect } from 'vitest';
import { createSkuContext } from './createSkuContext.js';
import { checkHosts, setupHosts } from './hosts.js';

describe('setupHosts', () => {
  beforeEach(() => {
    // Silence the logging for the tests
    vi.spyOn(global.console, 'log').mockImplementation(() => {});
    vi.spyOn(global.console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should set site-specific hosts', async () => {
    const context = await createSkuContext({});
    const mockSetHosts = vi.fn(async () => {});

    await setupHosts({
      getSystemHosts: async () => [],
      setSystemHost: mockSetHosts,
    })({
      ...context,
      sites: [
        { name: 'foo', host: 'seek.com.localhost' },
        { name: 'bar', host: 'au.seek.com.localhost' },
      ],
      hosts: [],
    });

    expect(mockSetHosts).toHaveBeenCalledWith(
      '127.0.0.1',
      'seek.com.localhost',
    );
    expect(mockSetHosts).toHaveBeenCalledWith(
      '127.0.0.1',
      'au.seek.com.localhost',
    );
  });

  it('should set app-wide hosts', async () => {
    const context = await createSkuContext({});
    const mockSetHosts = vi.fn(async () => {});

    await setupHosts({
      getSystemHosts: async () => [],
      setSystemHost: mockSetHosts,
    })({
      ...context,
      sites: [],
      hosts: ['au.seek.com.localhost', 'seek.com.localhost'],
    });

    expect(mockSetHosts).toHaveBeenCalledWith(
      '127.0.0.1',
      'au.seek.com.localhost',
    );
    expect(mockSetHosts).toHaveBeenCalledWith(
      '127.0.0.1',
      'seek.com.localhost',
    );
  });

  it('should combine app-wide and site-specific hosts', async () => {
    const context = await createSkuContext({});
    const mockSetHosts = vi.fn(async () => {});

    await setupHosts({
      getSystemHosts: async () => [],
      setSystemHost: mockSetHosts,
    })({
      ...context,
      sites: [{ name: 'foo', host: 'seek.com.localhost' }],
      hosts: ['au.seek.com.localhost'],
    });

    expect(mockSetHosts).toHaveBeenCalledWith(
      '127.0.0.1',
      'au.seek.com.localhost',
    );
    expect(mockSetHosts).toHaveBeenCalledWith(
      '127.0.0.1',
      'seek.com.localhost',
    );
  });

  it('should set ipv4 and ipv6 hosts', async () => {
    const context = await createSkuContext({});
    const mockSetHosts = vi.fn(async () => {});

    await setupHosts({
      getSystemHosts: async () => [],
      setSystemHost: mockSetHosts,
    })({
      ...context,
      hosts: ['au.seek.com.localhost'],
    });

    expect(mockSetHosts).toHaveBeenCalledTimes(2);
    expect(mockSetHosts).toHaveBeenCalledWith(
      '127.0.0.1',
      'au.seek.com.localhost',
    );
    expect(mockSetHosts).toHaveBeenCalledWith('::1', 'au.seek.com.localhost');
  });

  it('should skip exact localhost', async () => {
    const context = await createSkuContext({});
    const mockSetHosts = vi.fn(async () => {});

    await setupHosts({
      getSystemHosts: async () => [],
      setSystemHost: mockSetHosts,
    })({
      ...context,
      hosts: ['localhost', 'au.seek.com.localhost'],
    });

    expect(mockSetHosts).not.toHaveBeenCalledWith('127.0.0.1', 'localhost');
    expect(mockSetHosts).not.toHaveBeenCalledWith('::1', 'localhost');
    expect(mockSetHosts).toHaveBeenCalledWith(
      '127.0.0.1',
      'au.seek.com.localhost',
    );
  });

  it('should not set hosts if none are defined', async () => {
    const context = await createSkuContext({});
    const mockSetHosts = vi.fn(async () => {});

    await setupHosts({
      getSystemHosts: async () => [],
      setSystemHost: mockSetHosts,
    })({
      ...context,
      sites: [],
      hosts: [],
    });

    expect(mockSetHosts).not.toHaveBeenCalled();
  });

  it('should throw an error if setting hosts fails', async () => {
    const context = await createSkuContext({});
    const mockSetHosts = vi
      .fn(async () => {})
      .mockRejectedValue(new Error('Failed to set hosts'));

    await expect(
      setupHosts({
        getSystemHosts: async () => [],
        setSystemHost: mockSetHosts,
      })({
        ...context,
        sites: [],
        hosts: ['seek.com.localhost'],
      }),
    ).rejects.toThrow('Failed to set hosts');
  });
});

describe('checkHosts', () => {
  beforeEach(() => {
    // Silence the logging for the tests
    vi.spyOn(global.console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // All this function does is output info to the console so rather than testing the output we can just that it doesn't throw.
  it('should not throw errors', async () => {
    const context = await createSkuContext({});
    const mockGetHosts = vi.fn(async () => []);

    await expect(
      checkHosts({
        setSystemHost: async () => {},
        getSystemHosts: mockGetHosts,
      })({
        ...context,
        sites: [
          { name: 'foo', host: 'seek.com.localhost' },
          { name: 'bar', host: 'au.seek.com.localhost' },
        ],
        hosts: [],
      }),
    ).resolves.not.toThrow();
  });

  it('should not warn for missing .localhost hosts', async () => {
    const context = await createSkuContext({});
    const consoleLogSpy = vi.spyOn(global.console, 'log');

    await checkHosts({
      setSystemHost: async () => {},
      getSystemHosts: async () => [],
    })({
      ...context,
      hosts: ['au.seek.com.localhost'],
    });

    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it('should not warn for missing exact localhost', async () => {
    const context = await createSkuContext({});
    const consoleLogSpy = vi.spyOn(global.console, 'log');

    await checkHosts({
      setSystemHost: async () => {},
      getSystemHosts: async () => [],
    })({
      ...context,
      hosts: ['localhost'],
    });

    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it('should warn for missing non-localhost hosts', async () => {
    const context = await createSkuContext({});
    const consoleLogSpy = vi.spyOn(global.console, 'log');

    await checkHosts({
      setSystemHost: async () => {},
      getSystemHosts: async () => [],
    })({
      ...context,
      hosts: ['custom.example'],
    });

    expect(consoleLogSpy).toHaveBeenCalled();
    expect(
      consoleLogSpy.mock.calls.some((call) =>
        String(call[0]).includes('custom.example'),
      ),
    ).toBe(true);
  });
});
