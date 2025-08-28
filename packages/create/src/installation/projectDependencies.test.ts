import { describe, it, vi, beforeEach } from 'vitest';

const mockInstall = vi.fn().mockResolvedValue(undefined);
const mockInstallConfig = vi.fn().mockResolvedValue(undefined);
const mockIsPnpm = { value: false };
const mockIsAtLeastPnpmV10 = vi.fn(() => false);

vi.mock('../utils/packageManagerRunner.js', () => ({
  install: mockInstall,
  installConfig: mockInstallConfig,
}));

vi.mock('../utils/packageManager.js', () => ({
  get isPnpm() {
    return mockIsPnpm.value;
  },
  isAtLeastPnpmV10: mockIsAtLeastPnpmV10,
}));

const { installProjectDependencies } = await import('./projectDependencies.js');

describe('installProjectDependencies', () => {
  const mockTemplateConfig = {
    name: 'Test Template',
    description: 'Test template',
    dependencies: ['react@latest', 'react-dom@latest'],
    devDependencies: ['@types/react', '@types/react-dom'],
    scripts: { start: 'sku start' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    mockIsPnpm.value = false;
    mockIsAtLeastPnpmV10.mockReturnValue(false);
  });

  it('should install dependencies and dev dependencies', async ({ expect }) => {
    await installProjectDependencies(mockTemplateConfig);

    expect(mockInstall).toHaveBeenCalledTimes(2);
    expect(mockInstall).toHaveBeenCalledWith({
      deps: ['react@latest', 'react-dom@latest'],
      logLevel: 'regular',
    });
    expect(mockInstall).toHaveBeenCalledWith({
      deps: ['@types/react', '@types/react-dom', 'sku@latest'],
      type: 'dev',
      logLevel: 'regular',
      exact: false,
    });
  });

  it('should use verbose log level when verbose option is true', async ({
    expect,
  }) => {
    await installProjectDependencies(mockTemplateConfig, { verbose: true });

    expect(mockInstall).toHaveBeenCalledWith({
      deps: ['react@latest', 'react-dom@latest'],
      logLevel: 'verbose',
    });
  });

  it('should install pnpm plugin for pnpm v10+', async ({ expect }) => {
    mockIsPnpm.value = true;
    mockIsAtLeastPnpmV10.mockReturnValue(true);

    await installProjectDependencies(mockTemplateConfig);

    expect(mockInstallConfig).toHaveBeenCalledWith('pnpm-plugin-sku');
  });

  it('should not install pnpm plugin for pnpm < v10', async ({ expect }) => {
    mockIsPnpm.value = true;
    mockIsAtLeastPnpmV10.mockReturnValue(false);

    await installProjectDependencies(mockTemplateConfig);

    expect(mockInstallConfig).not.toHaveBeenCalled();
  });

  it('should handle pnpm plugin installation error gracefully', async ({
    expect,
  }) => {
    mockIsPnpm.value = true;
    mockIsAtLeastPnpmV10.mockReturnValue(true);
    mockInstallConfig.mockRejectedValue(
      new Error('Plugin installation failed'),
    );

    await installProjectDependencies(mockTemplateConfig);

    expect(console.warn).toHaveBeenCalledWith(
      'Failed to install pnpm-plugin-sku: Plugin installation failed',
    );
    expect(mockInstall).toHaveBeenCalledTimes(2);
  });
});
