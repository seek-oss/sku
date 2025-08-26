import { describe, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createFixture } from 'fs-fixture';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

describe('sku create integration', () => {
  const createCliPath = path.resolve(
    __dirname,
    '../../packages/create/dist/cli.js',
  );

  describe('project creation', () => {
    it('should create a webpack project with correct file structure', async ({
      expect,
    }) => {
      const fixture = await createFixture({});
      const projectName = 'test-webpack-app';
      const projectPath = path.join(fixture.path, projectName);

      // Create project using the CLI
      try {
        await execFileAsync(
          'node',
          [createCliPath, projectName, '--template', 'webpack'],
          {
            cwd: fixture.path,
            env: { ...process.env, npm_config_user_agent: 'pnpm/8.0.0' },
          },
        );
      } catch (error) {
        // The CLI might fail on package installation in test env, but should create files
        console.warn(
          'CLI execution had issues, checking if files were created:',
          error,
        );
      }

      // Verify package.json was created with correct content
      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageJsonContent = await readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageJsonContent);

      expect(packageJson.name).toBe(projectName);
      expect(packageJson.scripts).toMatchObject({
        start: 'sku start',
        build: 'sku build',
        test: 'sku test',
        serve: 'sku serve',
        lint: 'sku lint',
        format: 'sku format',
      });

      // Verify sku.config.ts was created
      const skuConfigPath = path.join(projectPath, 'sku.config.ts');
      const skuConfigContent = await readFile(skuConfigPath, 'utf-8');
      expect(skuConfigContent).toContain('clientEntry');
      expect(skuConfigContent).toContain('renderEntry');

      // Verify source files were created
      const appPath = path.join(projectPath, 'src/App/App.tsx');
      const appContent = await readFile(appPath, 'utf-8');
      expect(appContent).toContain('React');

      const clientPath = path.join(projectPath, 'src/client.tsx');
      const clientContent = await readFile(clientPath, 'utf-8');
      expect(clientContent).toContain('hydrate');

      // Verify .gitignore was created
      const gitignorePath = path.join(projectPath, '.gitignore');
      const gitignoreContent = await readFile(gitignorePath, 'utf-8');
      expect(gitignoreContent).toContain('node_modules');

      // Verify README was created
      const readmePath = path.join(projectPath, 'README.md');
      const readmeContent = await readFile(readmePath, 'utf-8');
      expect(readmeContent).toContain(projectName);
      expect(readmeContent).toContain('pnpm install');
    });

    it('should create a vite project with ESM configuration', async ({
      expect,
    }) => {
      const fixture = await createFixture({});
      const projectName = 'test-vite-app';
      const projectPath = path.join(fixture.path, projectName);

      try {
        await execFileAsync(
          'node',
          [createCliPath, projectName, '--template', 'vite'],
          {
            cwd: fixture.path,
            env: { ...process.env, npm_config_user_agent: 'pnpm/8.0.0' },
          },
        );
      } catch (error) {
        console.warn(
          'CLI execution had issues, checking if files were created:',
          error,
        );
      }

      // Verify package.json has type: "module" for vite
      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageJsonContent = await readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageJsonContent);

      expect(packageJson.type).toBe('module');
      expect(packageJson.scripts.start).toBe(
        'sku start --experimental-bundler',
      );
      expect(packageJson.scripts.build).toBe(
        'sku build --experimental-bundler',
      );

      // Verify sku.config.ts has vite bundler configuration
      const skuConfigPath = path.join(projectPath, 'sku.config.ts');
      const skuConfigContent = await readFile(skuConfigPath, 'utf-8');
      expect(skuConfigContent).toContain(
        "__UNSAFE_EXPERIMENTAL__bundler: 'vite'",
      );
    });

    it('should detect package manager from environment', async ({ expect }) => {
      const fixture = await createFixture({});
      const projectName = 'test-npm-app';
      const projectPath = path.join(fixture.path, projectName);

      try {
        await execFileAsync(
          'node',
          [createCliPath, projectName, '--template', 'webpack'],
          {
            cwd: fixture.path,
            env: {
              ...process.env,
              npm_config_user_agent: 'npm/8.19.2 node/v18.12.1',
            },
          },
        );
      } catch (error) {
        console.warn(
          'CLI execution had issues, checking if files were created:',
          error,
        );
      }

      const readmePath = path.join(projectPath, 'README.md');
      const readmeContent = await readFile(readmePath, 'utf-8');
      expect(readmeContent).toContain('npm install');
      expect(readmeContent).toContain('npm run start');
    });

    it('should handle invalid project names', async ({ expect }) => {
      const fixture = await createFixture({});

      // Test reserved name
      await expect(
        execFileAsync(
          'node',
          [createCliPath, 'react', '--template', 'webpack'],
          {
            cwd: fixture.path,
          },
        ),
      ).rejects.toThrow();

      // Test invalid characters
      await expect(
        execFileAsync(
          'node',
          [createCliPath, 'INVALID-NAME', '--template', 'webpack'],
          {
            cwd: fixture.path,
          },
        ),
      ).rejects.toThrow();
    });

    it('should set packageManager field in package.json when version is available', async ({
      expect,
    }) => {
      const fixture = await createFixture({});
      const projectName = 'test-pm-field';
      const projectPath = path.join(fixture.path, projectName);

      try {
        await execFileAsync(
          'node',
          [createCliPath, projectName, '--template', 'webpack'],
          {
            cwd: fixture.path,
            env: {
              ...process.env,
              npm_config_user_agent: 'pnpm/8.5.1 npm/? node/v18.12.1',
            },
          },
        );
      } catch (error) {
        console.warn(
          'CLI execution had issues, checking if files were created:',
          error,
        );
      }

      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageJsonContent = await readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageJsonContent);

      expect(packageJson.packageManager).toBe('pnpm@8.5.1');
    });
  });

  describe('CLI options', () => {
    it('should show help when --help flag is used', async ({ expect }) => {
      const { stdout } = await execFileAsync('node', [createCliPath, '--help']);

      expect(stdout).toContain('Create new sku projects');
      expect(stdout).toContain('--template');
      expect(stdout).toContain('--verbose');
    });

    it('should show version when --version flag is used', async ({
      expect,
    }) => {
      const { stdout } = await execFileAsync('node', [
        createCliPath,
        '--version',
      ]);

      expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });
});
