import { describe, it, vi, beforeEach } from 'vitest';
import { createTemplateData, normalizeFileName } from './templates.js';

vi.mock('@sku-lib/utils', () => ({
  getRunCommand: vi.fn((cmd: string) => `pnpm ${cmd}`),
  getInstallCommand: vi.fn(() => 'pnpm install'),
  getPackageManagerInstallPage: vi.fn(() => 'https://pnpm.io/installation'),
  packageManager: 'pnpm',
}));

describe('createTemplateData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create template data for webpack template', ({ expect }) => {
    const result = createTemplateData('my-app', 'webpack');

    expect(result.projectName).toBe('my-app');
    expect(result.appName).toBe('my-app');
    expect(result.startScript).toBe('pnpm start');
    expect(result.buildScript).toBe('pnpm build');
    expect(result.testScript).toBe('pnpm test');
    expect(result.formatScript).toBe('pnpm format');
    expect(result.lintScript).toBe('pnpm lint');
    expect(result.gettingStartedDocs).toContain('pnpm install');
    expect(result.gettingStartedDocs).toContain('https://pnpm.io/installation');
  });

  it('should create template data for vite template with experimental bundler flags', ({
    expect,
  }) => {
    const result = createTemplateData('my-vite-app', 'vite');

    expect(result.projectName).toBe('my-vite-app');
    expect(result.startScript).toBe('pnpm start --experimental-bundler');
    expect(result.buildScript).toBe('pnpm build --experimental-bundler');
    expect(result.testScript).toBe('pnpm test');
    expect(result.formatScript).toBe('pnpm format');
    expect(result.lintScript).toBe('pnpm lint');
  });

  it('should handle project names with special characters', ({ expect }) => {
    const result = createTemplateData('@scope/my-app', 'webpack');

    expect(result.projectName).toBe('@scope/my-app');
    expect(result.appName).toBe('@scope/my-app');
  });
});

describe('normalizeFileName', () => {
  it('should convert underscore prefixed files to dot files', ({ expect }) => {
    expect(normalizeFileName('_gitignore')).toBe('.gitignore');
  });

  it('should handle nested paths with underscore files', ({ expect }) => {
    expect(normalizeFileName('src/config/_eslintrc.js')).toBe(
      'src/config/.eslintrc.js',
    );
    expect(normalizeFileName('folder/subfolder/_gitignore')).toBe(
      'folder/subfolder/.gitignore',
    );
  });

  it('should leave normal files unchanged', ({ expect }) => {
    expect(normalizeFileName('package.json')).toBe('package.json');
    expect(normalizeFileName('src/index.ts')).toBe('src/index.ts');
    expect(normalizeFileName('README.md')).toBe('README.md');
  });

  it('should handle edge cases', ({ expect }) => {
    expect(normalizeFileName('')).toBe('');
    expect(normalizeFileName('_')).toBe('.');
    expect(normalizeFileName('__double')).toBe('._double');
  });
});
