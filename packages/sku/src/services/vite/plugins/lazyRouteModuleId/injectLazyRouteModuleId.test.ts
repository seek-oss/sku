import { join } from 'node:path';
import { createFixture } from 'fs-fixture';
import { describe, expect, it } from 'vitest';
import { injectLazyRouteModuleId } from './injectLazyRouteModuleId.js';

const createProject = () =>
  createFixture({
    'src/pages/about/about.tsx': 'export {};\n',
    'src/pages/details/details.tsx': 'export {};\n',
    'src/pages/hello/hello.tsx': 'export {};\n',
    'src/app.tsx': 'export {};\n',
  });

const sanitize = (code: string, root: string) =>
  code.replaceAll(root, '<root>');

/** Avoid the global CSS snapshot serializer matching transformed JS. */
const jsSnapshot = (code: string) => ({ $js: code });

expect.addSnapshotSerializer({
  test: (value) =>
    typeof value === 'object' &&
    value !== null &&
    Object.keys(value).length === 1 &&
    '$js' in value &&
    typeof value.$js === 'string',
  serialize: (value) => (value as { $js: string }).$js,
});

describe('injectLazyRouteModuleId', () => {
  const transform = (
    fixture: Awaited<ReturnType<typeof createFixture>>,
    code: string,
  ) =>
    injectLazyRouteModuleId({
      code,
      id: join(fixture.path, 'src/app.tsx'),
      cwd: fixture.path,
    });

  it('injects handle.moduleId for idiomatic lazy: () => import()', async () => {
    await using fixture = await createProject();
    const result = transform(
      fixture,
      `
      const routes = [{
        path: 'about',
        lazy: () => import('./pages/about/about'),
      }];
    `,
    );

    expect(result?.injected).toBe(true);
    expect(jsSnapshot(sanitize(result?.code ?? '', fixture.path)))
      .toMatchInlineSnapshot(`
      const routes = [{
        path: 'about',
        lazy: () => import('./pages/about/about'), handle: { moduleId: "src/pages/about/about.tsx" }
      }];
    `);
    expect(result?.map).not.toBeNull();
    expect(result?.map?.sources).toEqual(
      expect.arrayContaining([expect.stringContaining('src/app.tsx')]),
    );
  });

  it('resolves .js import specifiers to the real source extension', async () => {
    await using fixture = await createProject();
    const result = transform(
      fixture,
      `
      const routes = [{
        path: 'about',
        lazy: () => import('./pages/about/about.js'),
      }];
    `,
    );

    expect(jsSnapshot(sanitize(result?.code ?? '', fixture.path)))
      .toMatchInlineSnapshot(`
      const routes = [{
        path: 'about',
        lazy: () => import('./pages/about/about.js'), handle: { moduleId: "src/pages/about/about.tsx" }
      }];
    `);
  });

  it('preserves an explicit handle.moduleId', async () => {
    await using fixture = await createProject();
    const result = transform(
      fixture,
      `
      const routes = [{
        path: 'about',
        lazy: () => import('./pages/about/about'),
        handle: { moduleId: 'custom/about.js' },
      }];
    `,
    );

    expect(result).toBeNull();
  });

  it('adds moduleId to an existing handle without moduleId', async () => {
    await using fixture = await createProject();
    const result = transform(
      fixture,
      `
      const routes = [{
        path: 'about',
        lazy: () => import('./pages/about/about'),
        handle: { waitForAll: true },
      }];
    `,
    );

    expect(result?.injected).toBe(true);
    expect(jsSnapshot(sanitize(result?.code ?? '', fixture.path)))
      .toMatchInlineSnapshot(`
      const routes = [{
        path: 'about',
        lazy: () => import('./pages/about/about'),
        handle: { waitForAll: true, moduleId: "src/pages/about/about.tsx" }
      }];
    `);
  });

  it('skips granular lazy object shapes', async () => {
    await using fixture = await createProject();
    const result = transform(
      fixture,
      `
      const routes = [{
        path: 'about',
        lazy: {
          Component: () => import('./pages/about/about'),
        },
      }];
    `,
    );

    expect(result).toBeNull();
  });

  it('skips multi-import lazy functions', async () => {
    await using fixture = await createProject();
    const result = transform(
      fixture,
      `
      const routes = [{
        path: 'about',
        lazy: () => Promise.all([
          import('./pages/about/about'),
          import('./pages/details/details'),
        ]),
      }];
    `,
    );

    expect(result).toBeNull();
  });

  it('skips indirect lazy bindings', async () => {
    await using fixture = await createProject();
    const result = transform(
      fixture,
      `
      const loadAbout = () => import('./pages/about/about');
      const routes = [{
        path: 'about',
        lazy: loadAbout,
      }];
    `,
    );

    expect(result).toBeNull();
  });

  it('skips non-object handle values without guessing', async () => {
    await using fixture = await createProject();
    const result = transform(
      fixture,
      `
      const sharedHandle = { waitForAll: true };
      const routes = [{
        path: 'about',
        lazy: () => import('./pages/about/about'),
        handle: sharedHandle,
      }];
    `,
    );

    expect(result).toBeNull();
  });

  it('injects for multiple idiomatic lazy routes', async () => {
    await using fixture = await createProject();
    const result = transform(
      fixture,
      `
      const routes = [
        { path: 'about', lazy: () => import('./pages/about/about') },
        { path: 'details', lazy: () => import('./pages/details/details.js') },
      ];
    `,
    );

    expect(result?.injected).toBe(true);
    expect(jsSnapshot(sanitize(result?.code ?? '', fixture.path)))
      .toMatchInlineSnapshot(`
      const routes = [
      { path: 'about', lazy: () => import('./pages/about/about'), handle: { moduleId: "src/pages/about/about.tsx" } },
      { path: 'details', lazy: () => import('./pages/details/details.js'), handle: { moduleId: "src/pages/details/details.tsx" } }];
    `);
  });
});
