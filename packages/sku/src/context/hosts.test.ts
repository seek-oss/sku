import { describe, beforeEach, afterEach, it, vi, expect } from 'vitest';
import { createSkuContext } from './createSkuContext.js';
import { checkHosts, setupHosts } from './hosts.js';
import { addSystemHost, readSystemHosts } from './hostsFile.js';

vi.mock('./hostsFile.js', () => ({
  readSystemHosts: vi.fn(async () => []),
  addSystemHost: vi.fn(async () => {}),
}));

describe('setupHosts', () => {
  beforeEach(() => {
    // Silence the logging for the tests
    vi.spyOn(global.console, 'log').mockImplementation(() => {});
    vi.spyOn(global.console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('should set site-specific hosts', async () => {
    const context = await createSkuContext({});

    await setupHosts({
      ...context,
      sites: [
        { name: 'foo', host: 'seek.com.localhost' },
        { name: 'bar', host: 'au.seek.com.localhost' },
      ],
      hosts: [],
    });

    expect(addSystemHost).toHaveBeenCalledWith(
      '127.0.0.1',
      'seek.com.localhost',
    );
    expect(addSystemHost).toHaveBeenCalledWith(
      '127.0.0.1',
      'au.seek.com.localhost',
    );
  });

  it('should set app-wide hosts', async () => {
    const context = await createSkuContext({});

    await setupHosts({
      ...context,
      sites: [],
      hosts: ['au.seek.com.localhost', 'seek.com.localhost'],
    });

    expect(addSystemHost).toHaveBeenCalledWith(
      '127.0.0.1',
      'au.seek.com.localhost',
    );
    expect(addSystemHost).toHaveBeenCalledWith(
      '127.0.0.1',
      'seek.com.localhost',
    );
  });

  it('should combine app-wide and site-specific hosts', async () => {
    const context = await createSkuContext({});

    await setupHosts({
      ...context,
      sites: [{ name: 'foo', host: 'seek.com.localhost' }],
      hosts: ['au.seek.com.localhost'],
    });

    expect(addSystemHost).toHaveBeenCalledWith(
      '127.0.0.1',
      'au.seek.com.localhost',
    );
    expect(addSystemHost).toHaveBeenCalledWith(
      '127.0.0.1',
      'seek.com.localhost',
    );
  });

  it('should set ipv4 and ipv6 hosts', async () => {
    const context = await createSkuContext({});

    await setupHosts({
      ...context,
      hosts: ['au.seek.com.localhost'],
    });

    expect(addSystemHost).toHaveBeenCalledTimes(2);
    expect(addSystemHost).toHaveBeenCalledWith(
      '127.0.0.1',
      'au.seek.com.localhost',
    );
    expect(addSystemHost).toHaveBeenCalledWith('::1', 'au.seek.com.localhost');
  });

  it('should skip exact localhost', async () => {
    const context = await createSkuContext({});

    await setupHosts({
      ...context,
      hosts: ['localhost', 'au.seek.com.localhost'],
    });

    expect(addSystemHost).not.toHaveBeenCalledWith('127.0.0.1', 'localhost');
    expect(addSystemHost).not.toHaveBeenCalledWith('::1', 'localhost');
    expect(addSystemHost).toHaveBeenCalledWith(
      '127.0.0.1',
      'au.seek.com.localhost',
    );
  });

  it('should not set hosts if none are defined', async () => {
    const context = await createSkuContext({});

    await setupHosts({
      ...context,
      sites: [],
      hosts: [],
    });

    expect(addSystemHost).not.toHaveBeenCalled();
  });

  it('should warn when a host is already mapped to a different ip', async () => {
    const context = await createSkuContext({});
    const consoleLogSpy = vi.spyOn(global.console, 'log');
    vi.mocked(readSystemHosts).mockResolvedValueOnce([
      ['10.0.0.5', 'au.seek.com.localhost'],
    ]);

    await setupHosts({
      ...context,
      hosts: ['au.seek.com.localhost'],
    });

    const warnings = consoleLogSpy.mock.calls.filter((call) =>
      String(call[0]).includes('10.0.0.5'),
    );
    expect(warnings).toHaveLength(1);
  });

  it('should not warn when a host is mapped to the other ip version', async () => {
    const context = await createSkuContext({});
    const consoleLogSpy = vi.spyOn(global.console, 'log');
    vi.mocked(readSystemHosts).mockResolvedValueOnce([
      ['127.0.0.1', 'au.seek.com.localhost'],
    ]);

    await setupHosts({
      ...context,
      hosts: ['au.seek.com.localhost'],
    });

    expect(
      consoleLogSpy.mock.calls.some((call) =>
        String(call[0]).includes('already mapped'),
      ),
    ).toBe(false);
  });

  it('should throw an error if setting hosts fails', async () => {
    const context = await createSkuContext({});
    vi.mocked(addSystemHost).mockRejectedValueOnce(
      new Error('Failed to set hosts'),
    );

    await expect(
      setupHosts({
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
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  // All this function does is output info to the console so rather than testing the output we can just that it doesn't throw.
  it('should not throw errors', async () => {
    const context = await createSkuContext({});

    await expect(
      checkHosts({
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
      ...context,
      hosts: ['au.seek.com.localhost'],
    });

    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it('should not warn for missing exact localhost', async () => {
    const context = await createSkuContext({});
    const consoleLogSpy = vi.spyOn(global.console, 'log');

    await checkHosts({
      ...context,
      hosts: ['localhost'],
    });

    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it('should warn for missing non-localhost hosts', async () => {
    const context = await createSkuContext({});
    const consoleLogSpy = vi.spyOn(global.console, 'log');

    await checkHosts({
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
