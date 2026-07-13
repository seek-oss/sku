import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resolveManifestModuleId } from './resolveManifestModuleId.js';

describe('resolveManifestModuleId', () => {
  let projectRoot: string;

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), 'sku-manifest-module-id-'));
    mkdirSync(join(projectRoot, 'src/pages'), { recursive: true });
    writeFileSync(join(projectRoot, 'src/pages/about.tsx'), 'export {};\n');
    writeFileSync(join(projectRoot, 'src/app.tsx'), 'export {};\n');
  });

  afterEach(() => {
    rmSync(projectRoot, { recursive: true, force: true });
  });

  it('resolves extensionless imports to the real source file', () => {
    expect(
      resolveManifestModuleId({
        importerId: join(projectRoot, 'src/app.tsx'),
        importPath: './pages/about',
        cwd: projectRoot,
      }),
    ).toBe('src/pages/about.tsx');
  });

  it('sniffs the real extension when the import uses .js', () => {
    expect(
      resolveManifestModuleId({
        importerId: join(projectRoot, 'src/app.tsx'),
        importPath: './pages/about.js',
        cwd: projectRoot,
      }),
    ).toBe('src/pages/about.tsx');
  });

  it('strips Vite query strings from the importer id', () => {
    expect(
      resolveManifestModuleId({
        importerId: `${join(projectRoot, 'src/app.tsx')}?v=123`,
        importPath: './pages/about',
        cwd: projectRoot,
      }),
    ).toBe('src/pages/about.tsx');
  });

  it('returns null when the target file cannot be found', () => {
    expect(
      resolveManifestModuleId({
        importerId: join(projectRoot, 'src/app.tsx'),
        importPath: './pages/missing',
        cwd: projectRoot,
      }),
    ).toBeNull();
  });
});
