const path = require('node:path');
const fs = require('node:fs/promises');
const { promisify } = require('node:util');
const exec = promisify(require('node:child_process').exec);
const { runSkuScriptInDir } = require('@sku-private/test-utils');

const fixtureDirectory = __dirname;
const projectName = 'new-project';
const projectDirectory = path.join(fixtureDirectory, projectName);

describe('sku init', () => {
  beforeAll(async () => {
    await fs.rm(projectDirectory, { recursive: true, force: true });
  });

  afterAll(async () => {
    await fs.rm(projectDirectory, { recursive: true, force: true });

    console.log(
      "Running 'pnpm install' to clean up lockfile after sku-init test...",
    );
    await exec('pnpm install');
    console.log('Cleanup complete');
  });

  it(
    'should create a sku.config.ts',
    async () => {
      const projectName = 'new-project';
      await fs.rm(path.join(fixtureDirectory, projectName), {
        recursive: true,
        force: true,
      });

      const { child, stdout, stderr } = await runSkuScriptInDir(
        'init',
        fixtureDirectory,
        [projectName],
      );

      console.log('sku init stdout');
      console.log(stdout);
      console.log('sku init stderr');
      console.error(stderr);

      expect(child.exitCode).toBe(0);

      const skuConfig = await fs.readFile(
        path.join(fixtureDirectory, projectName, 'sku.config.ts'),
        'utf-8',
      );

      expect(skuConfig).toMatchInlineSnapshot(`
"import type { SkuConfig } from 'sku';

const skuConfig: SkuConfig = {
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  environments: ['development', 'production'],
  publicPath: '/path/to/public/assets/', // <-- Required for sku build output
};

export default skuConfig;
"
`);
    },
    // `sku init` is a long running task and can take some time to complete
    5 * 60 * 1000,
  );
});
