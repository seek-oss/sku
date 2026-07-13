import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { injectLazyRouteModuleId } from './injectLazyRouteModuleId.js';

describe('injectLazyRouteModuleId', () => {
  let projectRoot: string;

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), 'sku-lazy-module-id-'));
    mkdirSync(join(projectRoot, 'src/pages'), { recursive: true });
    writeFileSync(join(projectRoot, 'src/pages/about.tsx'), 'export {};\n');
    writeFileSync(join(projectRoot, 'src/pages/details.tsx'), 'export {};\n');
    writeFileSync(join(projectRoot, 'src/pages/hello.tsx'), 'export {};\n');
    writeFileSync(join(projectRoot, 'src/app.tsx'), 'export {};\n');
  });

  afterEach(() => {
    rmSync(projectRoot, { recursive: true, force: true });
  });

  const transform = (code: string) =>
    injectLazyRouteModuleId({
      code,
      id: join(projectRoot, 'src/app.tsx'),
      cwd: projectRoot,
    });

  it('injects handle.moduleId for idiomatic lazy: () => import()', () => {
    const result = transform(`
      const routes = [{
        path: 'about',
        lazy: () => import('./pages/about'),
      }];
    `);

    expect(result?.injected).toBe(true);
    expect(result?.code).toContain('moduleId');
    expect(result?.code).toContain('src/pages/about.tsx');
    expect(result?.code).toMatch(
      /lazy:\s*\(\)\s*=>\s*import\(['"]\.\/pages\/about['"]\)/,
    );
  });

  it('resolves .js import specifiers to the real source extension', () => {
    const result = transform(`
      const routes = [{
        path: 'about',
        lazy: () => import('./pages/about.js'),
      }];
    `);

    expect(result?.code).toContain('src/pages/about.tsx');
  });

  it('preserves an explicit handle.moduleId', () => {
    const result = transform(`
      const routes = [{
        path: 'about',
        lazy: () => import('./pages/about'),
        handle: { moduleId: 'custom/about.js' },
      }];
    `);

    expect(result).toBeNull();
  });

  it('adds moduleId to an existing handle without moduleId', () => {
    const result = transform(`
      const routes = [{
        path: 'about',
        lazy: () => import('./pages/about'),
        handle: { waitForAll: true },
      }];
    `);

    expect(result?.injected).toBe(true);
    expect(result?.code).toContain('waitForAll');
    expect(result?.code).toContain('src/pages/about.tsx');
  });

  it('skips granular lazy object shapes', () => {
    const result = transform(`
      const routes = [{
        path: 'about',
        lazy: {
          Component: () => import('./pages/about'),
        },
      }];
    `);

    expect(result).toBeNull();
  });

  it('skips multi-import lazy functions', () => {
    const result = transform(`
      const routes = [{
        path: 'about',
        lazy: () => Promise.all([
          import('./pages/about'),
          import('./pages/details'),
        ]),
      }];
    `);

    expect(result).toBeNull();
  });

  it('skips indirect lazy bindings', () => {
    const result = transform(`
      const loadAbout = () => import('./pages/about');
      const routes = [{
        path: 'about',
        lazy: loadAbout,
      }];
    `);

    expect(result).toBeNull();
  });

  it('skips non-object handle values without guessing', () => {
    const result = transform(`
      const sharedHandle = { waitForAll: true };
      const routes = [{
        path: 'about',
        lazy: () => import('./pages/about'),
        handle: sharedHandle,
      }];
    `);

    expect(result).toBeNull();
  });

  it('injects for multiple idiomatic lazy routes', () => {
    const result = transform(`
      const routes = [
        { path: 'about', lazy: () => import('./pages/about') },
        { path: 'details', lazy: () => import('./pages/details.js') },
      ];
    `);

    expect(result?.injected).toBe(true);
    expect(result?.code).toContain('src/pages/about.tsx');
    expect(result?.code).toContain('src/pages/details.tsx');
  });
});
