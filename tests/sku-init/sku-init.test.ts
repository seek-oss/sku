import { describe, beforeAll, afterAll, it } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { runSkuScriptInDir } from '@sku-private/test-utils';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const fixtureDirectory = __dirname;
const projectName = 'new-project';
const projectDirectory = path.join(fixtureDirectory, projectName);
const lockFilePath = path.join(process.cwd(), 'pnpm-lock.yaml');

describe('sku init', () => {
  let pnpmLockFile: string;

  beforeAll(
    async () => {
      pnpmLockFile = await fs.readFile(lockFilePath, 'utf-8');
      await fs.rm(projectDirectory, { recursive: true, force: true });

      await fs.rm(path.join(fixtureDirectory, projectName), {
        recursive: true,
        force: true,
      });

      const result = await runSkuScriptInDir('init', fixtureDirectory, {
        args: [projectName],
      });

      if (typeof result === 'undefined') {
        throw new Error('Process was aborted early');
      }

      const { stdout, stderr } = result;

      console.log('sku init stdout');
      console.log(stdout);
      console.log('sku init stderr');
      console.error(stderr);
    },
    // `sku init` is a long running task and can take some time to complete
    5 * 60 * 1000,
  );

  afterAll(async () => {
    await fs.rm(projectDirectory, { recursive: true, force: true });
    console.log(
      "Restoring original lock file and running 'pnpm install' to clean after sku-init test...",
    );
    await fs.writeFile(lockFilePath, pnpmLockFile, 'utf-8');
    spawnSync('pnpm', ['install']);
    console.log('Cleanup complete');
  });

  it('should create package.json', async ({ expect }) => {
    const contents = await fs.readFile(
      path.join(fixtureDirectory, projectName, 'package.json'),
      'utf-8',
    );

    expect(replaceDependencyVersions(JSON.parse(contents))).toMatchSnapshot();
  });

  it.for([
    'sku.config.ts',
    '.gitignore',
    '.prettierignore',
    'eslint.config.mjs',
    'README.md',
    'src/App/NextSteps.tsx',
  ])('should create %s', async (file, { expect }) => {
    const contents = await fs.readFile(
      path.join(fixtureDirectory, projectName, file),
      'utf-8',
    );

    expect(contents).toMatchSnapshot();
  });
});

/**
 *
 * When snapshot testing the package.json, we don't care about the specific versions of the dependencies.
 */
function replaceDependencyVersions(packageJson: Record<string, any>) {
  const newPackageJson = structuredClone(packageJson);

  // eslint-disable-next-line guard-for-in
  for (const dep in newPackageJson.dependencies) {
    newPackageJson.dependencies[dep] = 'VERSION_IGNORED';
  }

  // eslint-disable-next-line guard-for-in
  for (const dep in newPackageJson.devDependencies) {
    newPackageJson.devDependencies[dep] = 'VERSION_IGNORED';
  }

  return newPackageJson;
}
