import { describe, it } from 'vitest';
import { generatePackageJson } from './packageJsonGenerator.js';

const webpackTemplate = {
  name: 'Webpack (Default)',
  description: 'Standard React setup with Webpack bundler',
  dependencies: ['react@latest', 'react-dom@latest'],
  devDependencies: ['@types/react', '@types/react-dom'],
  scripts: {
    start: 'sku start',
    test: 'sku test',
    build: 'sku build',
    serve: 'sku serve',
    lint: 'sku lint',
    format: 'sku format',
  },
};

const viteTemplate = {
  ...webpackTemplate,
  name: 'Vite (Experimental)',
  description: 'Modern React setup with Vite bundler (experimental)',
  scripts: {
    start: 'sku start --experimental-bundler',
    test: 'sku test',
    build: 'sku build --experimental-bundler',
    serve: 'sku serve',
    lint: 'sku lint',
    format: 'sku format',
  },
  packageJsonExtras: {
    type: 'module',
  },
};

describe('generatePackageJson', () => {
  const mockPackageManagerInfo = {
    name: 'pnpm',
    version: '8.0.0',
    rootDir: null,
  };

  const projectDir = '/path/to/my-project';

  it('should generate basic package.json structure', ({ expect }) => {
    const result = generatePackageJson(
      'my-app',
      webpackTemplate,
      mockPackageManagerInfo,
      projectDir,
    );

    expect(result).toMatchObject({
      name: 'my-app',
      version: '0.1.0',
      private: true,
      scripts: webpackTemplate.scripts,
    });
  });

  it('should include packageManager field when at repo root with version', ({
    expect,
  }) => {
    const result = generatePackageJson(
      'my-app',
      webpackTemplate,
      mockPackageManagerInfo,
      projectDir,
    );

    expect(result.packageManager).toBe('pnpm@8.0.0');
  });

  it('should not include packageManager field when not at repo root', ({
    expect,
  }) => {
    const packageManagerInfo = {
      ...mockPackageManagerInfo,
      rootDir: '/different/path',
    };

    const result = generatePackageJson(
      'my-app',
      webpackTemplate,
      packageManagerInfo,
      projectDir,
    );

    expect(result).not.toHaveProperty('packageManager');
  });

  it('should not include packageManager field when no version available', ({
    expect,
  }) => {
    const packageManagerInfo = {
      ...mockPackageManagerInfo,
      version: null,
    };

    const result = generatePackageJson(
      'my-app',
      webpackTemplate,
      packageManagerInfo,
      projectDir,
    );

    expect(result).not.toHaveProperty('packageManager');
  });

  it('should include packageManager field when rootDir matches projectDir', ({
    expect,
  }) => {
    const packageManagerInfo = {
      ...mockPackageManagerInfo,
      rootDir: projectDir,
    };

    const result = generatePackageJson(
      'my-app',
      webpackTemplate,
      packageManagerInfo,
      projectDir,
    );

    expect(result.packageManager).toBe('pnpm@8.0.0');
  });

  it('should include template extras for vite template', ({ expect }) => {
    const result = generatePackageJson(
      'my-vite-app',
      viteTemplate,
      mockPackageManagerInfo,
      projectDir,
    );

    expect(result).toMatchObject({
      name: 'my-vite-app',
      version: '0.1.0',
      private: true,
      type: 'module',
      scripts: viteTemplate.scripts,
      packageManager: 'pnpm@8.0.0',
    });
  });

  it('should not include template extras for webpack template', ({
    expect,
  }) => {
    const result = generatePackageJson(
      'my-webpack-app',
      webpackTemplate,
      mockPackageManagerInfo,
      projectDir,
    );

    expect(result).not.toHaveProperty('type');
  });
});
