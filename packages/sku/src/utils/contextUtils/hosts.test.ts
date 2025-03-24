import { createSkuContext } from '@/context/createSkuContext.js';
import { checkHosts, setupHosts } from './hosts.js';
import { jest } from '@jest/globals';

describe('setupHosts', () => {
  beforeEach(() => {
    // Silence the logging for the tests
    jest.spyOn(global.console, 'log').mockImplementation(() => {});
    jest.spyOn(global.console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should set site-specific hosts', async () => {
    const context = createSkuContext({});
    const mockSetHosts = jest.fn(async () => {});

    await setupHosts({
      getSystemHosts: async () => [],
      setSystemHost: mockSetHosts,
    })({
      ...context,
      sites: [
        { name: 'foo', host: 'dev.seek.com' },
        { name: 'bar', host: 'local.seek.com' },
      ],
      hosts: [],
    });

    expect(mockSetHosts).toHaveBeenCalledWith('127.0.0.1', 'dev.seek.com');
    expect(mockSetHosts).toHaveBeenCalledWith('127.0.0.1', 'local.seek.com');
  });

  it('should set app-wide hosts', async () => {
    const context = createSkuContext({});
    const mockSetHosts = jest.fn(async () => {});

    await setupHosts({
      getSystemHosts: async () => [],
      setSystemHost: mockSetHosts,
    })({
      ...context,
      sites: [],
      hosts: ['local.seek.com', 'dev.seek.com'],
    });

    expect(mockSetHosts).toHaveBeenCalledWith('127.0.0.1', 'local.seek.com');
    expect(mockSetHosts).toHaveBeenCalledWith('127.0.0.1', 'dev.seek.com');
  });

  it('should combine app-wide and site-specific hosts', async () => {
    const context = createSkuContext({});
    const mockSetHosts = jest.fn(async () => {});

    await setupHosts({
      getSystemHosts: async () => [],
      setSystemHost: mockSetHosts,
    })({
      ...context,
      sites: [{ name: 'foo', host: 'dev.seek.com' }],
      hosts: ['local.seek.com'],
    });

    expect(mockSetHosts).toHaveBeenCalledWith('127.0.0.1', 'local.seek.com');
    expect(mockSetHosts).toHaveBeenCalledWith('127.0.0.1', 'dev.seek.com');
  });

  it('should set ipv4 and ipv6 hosts', async () => {
    const context = createSkuContext({});
    const mockSetHosts = jest.fn(async () => {});

    await setupHosts({
      getSystemHosts: async () => [],
      setSystemHost: mockSetHosts,
    })({
      ...context,
      hosts: ['local.seek.com'],
    });

    expect(mockSetHosts).toHaveBeenCalledTimes(2);
    expect(mockSetHosts).toHaveBeenCalledWith('127.0.0.1', 'local.seek.com');
    expect(mockSetHosts).toHaveBeenCalledWith('::1', 'local.seek.com');
  });

  it('should not set hosts if none are defined', async () => {
    const context = createSkuContext({});
    const mockSetHosts = jest.fn(async () => {});

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
    const context = createSkuContext({});
    const mockSetHosts = jest
      .fn(async () => {})
      .mockRejectedValue(new Error('Failed to set hosts'));

    await expect(async () => {
      await setupHosts({
        getSystemHosts: async () => [],
        setSystemHost: mockSetHosts,
      })({
        ...context,
        sites: [],
        hosts: ['dev.seek.com'],
      });
    }).rejects.toThrow('Failed to set hosts');
  });
});

describe('checkHosts', () => {
  beforeEach(() => {
    // Silence the logging for the tests
    jest.spyOn(global.console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // All this function does is output info to the console so rather than testing the output we can just that it doesn't throw.
  it('should not throw errors', async () => {
    const context = createSkuContext({});
    const mockGetHosts = jest.fn(async () => []);

    await expect(
      checkHosts({
        setSystemHost: async () => {},
        getSystemHosts: mockGetHosts,
      })({
        ...context,
        sites: [
          { name: 'foo', host: 'dev.seek.com' },
          { name: 'bar', host: 'local.seek.com' },
        ],
        hosts: [],
      }),
    ).resolves.not.toThrow();
  });
});
