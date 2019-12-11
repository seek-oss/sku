/* eslint-disable jest/expect-expect */
/* eslint-disable jest/expect-expect */
const path = require('path');
const { promisify } = require('util');
const rimrafAsync = promisify(require('rimraf'));
const fs = require('fs-extra');
const dirContentsToObject = require('../../utils/dirContentsToObject');
const runSkuScriptInDir = require('../../utils/runSkuScriptInDir');
const waitForUrls = require('../../utils/waitForUrls');
const appDir = path.resolve(__dirname, 'app');
const distDir = path.resolve(appDir, 'dist');
const { cwd } = require('../../../lib/cwd');

function createPackageLink(name) {
  return fs.symlink(
    `${cwd()}/node_modules/${name}`,
    `${__dirname}/app/node_modules/${name}`,
  );
}

async function linkLocalDependencies() {
  const nodeModules = `${__dirname}/app/node_modules`;
  await rimrafAsync(nodeModules);
  await fs.mkdir(nodeModules);
  await Promise.all(
    ['react', 'react-dom', 'seek-style-guide'].map(createPackageLink),
  );
}

const assertStorybookContent = async url => {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  const content = await page.evaluate(async () => {
    const svg = await window.document
      .querySelector('iframe')
      .contentDocument.querySelector('[data-automation-svg] svg');

    const textElement = await window.document
      .querySelector('iframe')
      .contentDocument.querySelector('[data-automation-text]');
    const text = textElement.innerText;

    return { svg, text };
  });

  expect(content.svg).not.toEqual(null);
  expect(content.text).toEqual('Hello world!');
};

describe('seek-style-guide', () => {
  beforeAll(async () => {
    // "Install" React and seek-style-guide into this test app so that webpack-node-externals
    // treats them correctly.
    await linkLocalDependencies();
    await runSkuScriptInDir('build', appDir);
  });

  it('should generate the expected files', async () => {
    const files = await dirContentsToObject(distDir);
    expect(files).toMatchSnapshot();
  });

  it('should handle seek-style-guide in tests', async () => {
    const { childProcess } = await runSkuScriptInDir('test', appDir);
    expect(childProcess.exitCode).toEqual(0);
  });

  describe('storybook', () => {
    const storybookUrl = 'http://localhost:8081';
    let server;

    beforeAll(async () => {
      server = await runSkuScriptInDir('storybook', appDir, ['--ci']);
      await waitForUrls(storybookUrl);
    });

    afterAll(async () => {
      await server.kill();
    });

    it('should start a storybook server', async () => {
      await assertStorybookContent(storybookUrl);
    });
  });
});
