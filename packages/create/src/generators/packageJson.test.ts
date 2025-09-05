import { describe, it } from 'vitest';
import { createFixture } from 'fs-fixture';
import { generatePackageJson } from './packageJson.js';

describe('generatePackageJson', () => {
  it('should generate package.json for webpack template', async ({
    expect,
  }) => {
    const fixture = await createFixture({});

    await generatePackageJson(fixture.path, {
      projectName: 'my-app',
      template: 'webpack',
    });

    const packageJsonContent = await fixture.readFile('package.json', 'utf8');
    const packageJson = JSON.parse(packageJsonContent);

    expect(packageJson.name).toBe('my-app');
    expect(packageJson.version).toBe('1.0.0');
    expect(packageJson.private).toBe(true);
    expect(packageJson.scripts).toMatchObject({
      start: expect.stringContaining('start'),
      build: expect.stringContaining('build'),
      test: expect.stringContaining('test'),
      lint: expect.stringContaining('lint'),
      format: expect.stringContaining('format'),
    });

    await fixture.rm();
  });

  it('should generate package.json for vite template', async ({ expect }) => {
    const fixture = await createFixture({});

    await generatePackageJson(fixture.path, {
      projectName: 'my-vite-app',
      template: 'vite',
    });

    const packageJsonContent = await fixture.readFile('package.json', 'utf8');
    const packageJson = JSON.parse(packageJsonContent);

    expect(packageJson.name).toBe('my-vite-app');
    expect(packageJson.type).toBe('module');
    expect(packageJson.scripts.start).toContain('--experimental-bundler');
    expect(packageJson.scripts.build).toContain('--experimental-bundler');

    await fixture.rm();
  });

  it('should handle scoped package names', async ({ expect }) => {
    const fixture = await createFixture({});

    await generatePackageJson(fixture.path, {
      projectName: '@scope/my-app',
      template: 'webpack',
    });

    const packageJsonContent = await fixture.readFile('package.json', 'utf8');
    const packageJson = JSON.parse(packageJsonContent);

    expect(packageJson.name).toBe('@scope/my-app');

    await fixture.rm();
  });
});
