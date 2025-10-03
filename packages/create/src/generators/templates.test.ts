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
    const result = createTemplateData('my-app');

    expect(result).toMatchInlineSnapshot(`
      {
        "appName": "my-app",
        "buildScript": "pnpm build",
        "formatScript": "pnpm format",
        "gettingStartedDocs": "First of all, make sure you've installed [pnpm](https://pnpm.io/installation).

      Then, install dependencies:

      \`\`\`sh
      $ pnpm install
      \`\`\`",
        "lintScript": "pnpm lint",
        "projectName": "my-app",
        "startScript": "pnpm start",
        "testScript": "pnpm test",
      }
    `);
  });

  it('should create template data for vite template with experimental bundler flags', ({
    expect,
  }) => {
    const result = createTemplateData('my-vite-app');

    expect(result).toMatchInlineSnapshot(`
      {
        "appName": "my-vite-app",
        "buildScript": "pnpm build",
        "formatScript": "pnpm format",
        "gettingStartedDocs": "First of all, make sure you've installed [pnpm](https://pnpm.io/installation).

      Then, install dependencies:

      \`\`\`sh
      $ pnpm install
      \`\`\`",
        "lintScript": "pnpm lint",
        "projectName": "my-vite-app",
        "startScript": "pnpm start",
        "testScript": "pnpm test",
      }
    `);
  });

  it('should handle project names with special characters', ({ expect }) => {
    const result = createTemplateData('@scope/my-app');

    expect(result).toMatchInlineSnapshot(`
      {
        "appName": "@scope/my-app",
        "buildScript": "pnpm build",
        "formatScript": "pnpm format",
        "gettingStartedDocs": "First of all, make sure you've installed [pnpm](https://pnpm.io/installation).

      Then, install dependencies:

      \`\`\`sh
      $ pnpm install
      \`\`\`",
        "lintScript": "pnpm lint",
        "projectName": "@scope/my-app",
        "startScript": "pnpm start",
        "testScript": "pnpm test",
      }
    `);
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
