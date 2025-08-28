import { describe, it } from 'vitest';
import { generatePackageJson } from './packageJsonGenerator.js';
import { TEMPLATES } from '../templates/templateConfigs.js';

describe('generatePackageJson', () => {
  const basePackageManagerInfo = {
    name: 'pnpm',
    version: '8.0.0',
    rootDir: '/project',
  };

  const projectDir = '/project';

  it('should generate basic package.json with webpack template', ({
    expect,
  }) => {
    const result = generatePackageJson(
      'test-app',
      TEMPLATES.webpack,
      basePackageManagerInfo,
      projectDir,
    );

    expect(result).toEqual({
      name: 'test-app',
      version: '0.1.0',
      private: true,
      scripts: TEMPLATES.webpack.scripts,
      packageManager: 'pnpm@8.0.0',
    });
  });

  it('should merge packageJsonExtras from vite template', ({ expect }) => {
    const result = generatePackageJson(
      'vite-app',
      TEMPLATES.vite,
      basePackageManagerInfo,
      projectDir,
    );

    expect(result.type).toBe('module');
    expect(result.scripts).toBe(TEMPLATES.vite.scripts);
  });

  it('should omit packageManager when version is null', ({ expect }) => {
    const packageManagerWithoutVersion = {
      ...basePackageManagerInfo,
      version: null,
    };

    const result = generatePackageJson(
      'test-app',
      TEMPLATES.webpack,
      packageManagerWithoutVersion,
      projectDir,
    );

    expect(result.packageManager).toBeUndefined();
  });

  it('should omit packageManager when not at repo root', ({ expect }) => {
    const packageManagerAtDifferentRoot = {
      ...basePackageManagerInfo,
      rootDir: '/different/root',
    };

    const result = generatePackageJson(
      'test-app',
      TEMPLATES.webpack,
      packageManagerAtDifferentRoot,
      projectDir,
    );

    expect(result.packageManager).toBeUndefined();
  });

  it('should include packageManager when rootDir is null', ({ expect }) => {
    const packageManagerAtRoot = {
      ...basePackageManagerInfo,
      rootDir: null,
    };

    const result = generatePackageJson(
      'test-app',
      TEMPLATES.webpack,
      packageManagerAtRoot,
      projectDir,
    );

    expect(result.packageManager).toBe('pnpm@8.0.0');
  });
});
