import path from 'node:path';
import fs from 'node:fs/promises';
import { promisify } from 'node:util';
import { exec as childProcessExec } from 'node:child_process';
import { runSkuScriptInDir } from '@sku-private/test-utils';

const exec = promisify(childProcessExec);

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const fixtureDirectory = __dirname;
const projectName = 'new-project';
const projectDirectory = path.join(fixtureDirectory, projectName);

describe('sku init', () => {
  let child;
  let stdout;
  let stderr;

  beforeAll(
    async () => {
      await fs.rm(projectDirectory, { recursive: true, force: true });

      await fs.rm(path.join(fixtureDirectory, projectName), {
        recursive: true,
        force: true,
      });

      ({ child, stdout, stderr } = await runSkuScriptInDir(
        'init',
        fixtureDirectory,
        [projectName],
      ));

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
      "Running 'pnpm install' to clean up lockfile after sku-init test...",
    );
    await exec('pnpm install');
    console.log('Cleanup complete');
  });

  it('should exit with code 0', async () => {
    expect(child.exitCode).toBe(0);
  });

  it('should create package.json', async () => {
    const contents = await fs.readFile(
      path.join(fixtureDirectory, projectName, 'package.json'),
      'utf-8',
    );

    expect(replaceDependencyVersions(JSON.parse(contents))).toMatchSnapshot();
  });

  it.each([
    'sku.config.ts',
    '.gitignore',
    '.prettierignore',
    'eslint.config.mjs',
    'README.md',
    'src/App/NextSteps.tsx',
  ])('should create %s', async (file) => {
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
function replaceDependencyVersions(packageJson) {
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
