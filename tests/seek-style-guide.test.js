/* eslint-disable jest/expect-expect */
const path = require('path');
const dirContentsToObject = require('../test/utils/dirContentsToObject');
const runSkuScriptInDir = require('../test/utils/runSkuScriptInDir');
const waitForUrls = require('../test/utils/waitForUrls');

const appDir = path.dirname(
  require.resolve('@fixtures/seek-style-guide/sku.config.js'),
);
const distDir = path.resolve(appDir, 'dist');

const assertStorybookContent = async (url) => {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  const content = await page.evaluate(() => {
    const svg = window.document
      .querySelector('iframe')
      .contentDocument.querySelector('[data-automation-svg] svg');

    const textElement = window.document
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
    const storybookUrl = 'http://localhost:8083';
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
      expect.assertions(2);
    });
  });
});
