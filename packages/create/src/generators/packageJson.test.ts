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

    expect(packageJsonContent).toMatchInlineSnapshot(`
      "{
        "name": "my-app",
        "version": "1.0.0",
        "private": true,
        "scripts": {
          "start": "sku start",
          "build": "sku build",
          "test": "sku test",
          "format": "sku format",
          "lint": "sku lint"
        }
      }
      "
    `);

    await fixture.rm();
  });

  it('should generate package.json for vite template', async ({ expect }) => {
    const fixture = await createFixture({});

    await generatePackageJson(fixture.path, {
      projectName: 'my-vite-app',
      template: 'vite',
    });

    const packageJsonContent = await fixture.readFile('package.json', 'utf8');

    expect(packageJsonContent).toMatchInlineSnapshot(`
      "{
        "name": "my-vite-app",
        "version": "1.0.0",
        "private": true,
        "type": "module",
        "scripts": {
          "start": "sku start --experimental-bundler",
          "build": "sku build --experimental-bundler",
          "test": "sku test --run",
          "format": "sku format",
          "lint": "sku lint"
        }
      }
      "
    `);

    await fixture.rm();
  });

  it('should handle scoped package names', async ({ expect }) => {
    const fixture = await createFixture({});

    await generatePackageJson(fixture.path, {
      projectName: '@scope/my-app',
      template: 'webpack',
    });

    const packageJsonContent = await fixture.readFile('package.json', 'utf8');

    expect(packageJsonContent).toMatchInlineSnapshot(`
      "{
        "name": "@scope/my-app",
        "version": "1.0.0",
        "private": true,
        "scripts": {
          "start": "sku start",
          "build": "sku build",
          "test": "sku test",
          "format": "sku format",
          "lint": "sku lint"
        }
      }
      "
    `);

    await fixture.rm();
  });
});
