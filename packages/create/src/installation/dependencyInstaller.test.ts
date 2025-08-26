import { describe, it, vi, beforeEach, afterEach } from 'vitest';
import { installProjectDependencies } from './dependencyInstaller.js';

// Mock dependencies
vi.mock('../utils/execAsync.js');
vi.mock('../utils/packageInstaller.js');
vi.mock('../utils/packageManager.js');
vi.mock('chalk', () => ({
  default: {
    cyan: (str: string) => str,
  },
}));

import { execAsync } from '../utils/execAsync.js';
import { install } from '../utils/packageInstaller.js';
import { isAtLeastPnpmV10 } from '../utils/packageManager.js';

describe('installProjectDependencies', () => {
  const originalConsoleLog = console.log;

  const mockTemplateConfig = {
    dependencies: ['react@latest', 'react-dom@latest'],
    devDependencies: ['@types/react', '@types/react-dom'],
  };

  beforeEach(() => {
    console.log = vi.fn();
    vi.mocked(execAsync).mockResolvedValue('');
    vi.mocked(install).mockResolvedValue(undefined);
    vi.mocked(isAtLeastPnpmV10).mockReturnValue(false);
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    vi.clearAllMocks();
  });

  it('should install production and dev dependencies', async ({ expect }) => {
    await installProjectDependencies(mockTemplateConfig);

    expect(install).toHaveBeenCalledTimes(2);

    // First call: production dependencies
    expect(install).toHaveBeenCalledWith({
      deps: ['react@latest', 'react-dom@latest'],
      logLevel: 'regular',
    });

    // Second call: dev dependencies including sku
    expect(install).toHaveBeenCalledWith({
      deps: ['@types/react', '@types/react-dom', 'sku@latest'],
      type: 'dev',
      logLevel: 'regular',
      exact: false,
    });
  });

  it('should use verbose logging when verbose option is true', async ({
    expect,
  }) => {
    await installProjectDependencies(mockTemplateConfig, { verbose: true });

    expect(install).toHaveBeenCalledWith({
      deps: ['react@latest', 'react-dom@latest'],
      logLevel: 'verbose',
    });

    expect(install).toHaveBeenCalledWith({
      deps: ['@types/react', '@types/react-dom', 'sku@latest'],
      type: 'dev',
      logLevel: 'verbose',
      exact: false,
    });
  });

  it('should install pnpm plugin when using PNPM v10+', async ({ expect }) => {
    vi.mocked(isAtLeastPnpmV10).mockReturnValue(true);

    await installProjectDependencies(mockTemplateConfig);

    expect(execAsync).toHaveBeenCalledWith('pnpm add --config pnpm-plugin-sku');
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining(
        'Installing PNPM config dependency pnpm-plugin-sku',
      ),
    );
  });

  it('should not install pnpm plugin when not using PNPM v10+', async ({
    expect,
  }) => {
    vi.mocked(isAtLeastPnpmV10).mockReturnValue(false);

    await installProjectDependencies(mockTemplateConfig);

    expect(execAsync).not.toHaveBeenCalled();
  });

  it('should always include sku@latest in dev dependencies', async ({
    expect,
  }) => {
    const templateWithoutSku = {
      dependencies: ['react@latest'],
      devDependencies: ['@types/react'],
    };

    await installProjectDependencies(templateWithoutSku);

    expect(install).toHaveBeenCalledWith({
      deps: ['@types/react', 'sku@latest'],
      type: 'dev',
      logLevel: 'regular',
      exact: false,
    });
  });

  it('should display installation progress messages', async ({ expect }) => {
    await installProjectDependencies(mockTemplateConfig);

    expect(console.log).toHaveBeenCalledWith(
      'Installing dependencies. This might take a while.',
    );

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining(
        'Installing react@latest, react-dom@latest, @types/react, @types/react-dom, sku@latest...',
      ),
    );
  });
});
