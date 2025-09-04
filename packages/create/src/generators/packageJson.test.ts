import { describe, it, beforeEach, afterEach } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFile, mkdir, rm } from 'node:fs/promises';
import { generatePackageJson } from './packageJson.js';

describe('generatePackageJson', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `create-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(tempDir, { recursive: true });
    } catch {}
  });

  it('should generate package.json for webpack template', async ({
    expect,
  }) => {
    await generatePackageJson(tempDir, {
      projectName: 'my-app',
      template: 'webpack',
    });

    const packageJsonContent = await readFile(
      join(tempDir, 'package.json'),
      'utf8',
    );
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
  });

  it('should generate package.json for vite template', async ({ expect }) => {
    await generatePackageJson(tempDir, {
      projectName: 'my-vite-app',
      template: 'vite',
    });

    const packageJsonContent = await readFile(
      join(tempDir, 'package.json'),
      'utf8',
    );
    const packageJson = JSON.parse(packageJsonContent);

    expect(packageJson.name).toBe('my-vite-app');
    expect(packageJson.type).toBe('module');
    expect(packageJson.scripts.start).toContain('--experimental-bundler');
    expect(packageJson.scripts.build).toContain('--experimental-bundler');
  });

  it('should handle scoped package names', async ({ expect }) => {
    await generatePackageJson(tempDir, {
      projectName: '@scope/my-app',
      template: 'webpack',
    });

    const packageJsonContent = await readFile(
      join(tempDir, 'package.json'),
      'utf8',
    );
    const packageJson = JSON.parse(packageJsonContent);

    expect(packageJson.name).toBe('@scope/my-app');
  });
});
