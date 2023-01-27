const path = require('path');
const { promisify } = require('util');
const rimrafAsync = promisify(require('rimraf'));
const fs = require('fs-extra');
const runSkuScriptInDir = require('../../utils/runSkuScriptInDir');
const { getAppSnapshot } = require('../../utils/appSnapshot');
const waitForUrls = require('../../utils/waitForUrls');
const { getPathFromCwd } = require('../../../lib/cwd');
const appDir = path.resolve(__dirname, 'app');

async function createPackageLink(name) {
  await fs.mkdirp(`${__dirname}/app/node_modules`);
  await fs.symlink(
    getPathFromCwd(`node_modules/${name}`),
    `${__dirname}/app/node_modules/${name}`,
  );
}

async function setUpLocalDependencies() {
  const nodeModules = `${__dirname}/app/node_modules`;
  await rimrafAsync(nodeModules);
  await Promise.all(['react', 'react-dom'].map(createPackageLink));
}

describe('storybook-dev-middleware', () => {
  beforeAll(async () => {
    // "Install" React and braid-design-system into this test app so that webpack-node-externals
    // treats them correctly.
    await setUpLocalDependencies();
  });

  describe('storybook', () => {
    const storybookUrl = `http://localhost:8081`;
    let process;

    beforeAll(async () => {
      process = await runSkuScriptInDir('storybook', appDir);
      await waitForUrls(storybookUrl, `${storybookUrl}/test-middleware`);
    });

    afterAll(async () => {
      await process.kill();
    });

    it('should support the supplied middleware', async () => {
      const snapshot = await getAppSnapshot(`${storybookUrl}/test-middleware`);
      expect(snapshot).toMatchSnapshot();
    });
  });
});
