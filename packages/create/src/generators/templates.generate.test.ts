import { describe, it } from 'vitest';
import { createFixture } from 'fs-fixture';
import { generateTemplateFiles } from './templates.js';

describe('generateTemplateFiles', () => {
  it('should scaffold vite-ssr with required config and named exports', async ({
    expect,
  }) => {
    const fixture = await createFixture({});

    await generateTemplateFiles(fixture.path, {
      projectName: 'my-vite-ssr-app',
      template: 'vite-ssr',
    });

    const skuConfig = await fixture.readFile('sku.config.ts', 'utf8');
    expect(skuConfig).toContain("bundler: 'vite'");
    expect(skuConfig).toContain("buildType: 'ssr'");
    expect(skuConfig).toContain("publicPath: '/'");
    expect(skuConfig).not.toContain('renderEntry');

    const routes = await fixture.readFile('src/routes.tsx', 'utf8');
    expect(routes).toContain('export function createRoutes');
    expect(routes).toContain('homeRoute');
    expect(routes).toContain('aboutRoute');

    const server = await fixture.readFile('src/server.tsx', 'utf8');
    expect(server).toContain('export const routes');
    expect(server).toContain('createRoutes');
    expect(server).toContain('export const onRequest');
    expect(server).toContain('export const middleware');

    const client = await fixture.readFile('src/client.tsx', 'utf8');
    expect(client).toContain('export const routes');
    expect(client).toContain('createRoutes');
    expect(client).toContain('export const onHydrate');
    expect(client).not.toContain('hydrateRoot');
    expect(client).not.toContain("getElementById('app')");
    expect(client).not.toContain('routesEntry');

    expect(await fixture.exists('src/render.tsx')).toBe(false);
    expect(await fixture.exists('src/pages/home/route.ts')).toBe(true);
    expect(await fixture.exists('src/pages/about/route.ts')).toBe(true);

    const readme = await fixture.readFile('README.md', 'utf8');
    expect(readme).toContain('sku start');
    expect(readme).toContain('hydrateRoot(document)');

    await fixture.rm();
  });

  it('should not set buildType ssr on static vite template', async ({
    expect,
  }) => {
    const fixture = await createFixture({});

    await generateTemplateFiles(fixture.path, {
      projectName: 'my-vite-app',
      template: 'vite',
    });

    const skuConfig = await fixture.readFile('sku.config.ts', 'utf8');
    expect(skuConfig).toContain("bundler: 'vite'");
    expect(skuConfig).not.toContain("buildType: 'ssr'");
    expect(skuConfig).toContain('renderEntry');
    expect(await fixture.exists('src/render.tsx')).toBe(true);
    expect(await fixture.exists('src/client.tsx')).toBe(true);

    const client = await fixture.readFile('src/client.tsx', 'utf8');
    expect(client).toContain("getElementById('app')");

    await fixture.rm();
  });
});
