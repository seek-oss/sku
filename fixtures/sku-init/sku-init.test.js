const path = require('node:path');
const fs = require('node:fs/promises');
const { promisify } = require('node:util');
const exec = promisify(require('node:child_process').exec);
const { runSkuScriptInDir } = require('@sku-private/test-utils');

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

      const projectName = 'new-project';
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
    'eslint.config.js',
    '.prettierignore',
    'README.md',
    'src/App/NextSteps.tsx',
  ])('should create %s', async (file) => {
    const contents = await fs.readFile(
      path.join(fixtureDirectory, projectName, file),
      'utf-8',
    );

    expect(contents.replace(process.cwd(), '<cwd>')).toMatchSnapshot();
  });
});

/**
 *
 * When snapshot testing the package.json, we don't care about the specific versions of the dependencies.
 */
function replaceDependencyVersions(packageJson) {
  const newPackageJson = structuredClone(packageJson);

  for (const dep in newPackageJson.dependencies) {
    newPackageJson.dependencies[dep] = 'VERSION_IGNORED';
  }

  for (const dep in newPackageJson.devDependencies) {
    newPackageJson.devDependencies[dep] = 'VERSION_IGNORED';
  }

  return newPackageJson;
}
