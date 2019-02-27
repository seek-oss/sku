const diff = require('git-diff');
const prettier = require('prettier');
const css = require('css');

const cssSnapshotSerializer = {
  print: value => prettier.format(value, { parser: 'css' }),
  test: value => {
    try {
      css.parse(value);
    } catch (e) {
      return false;
    }
    return true;
  }
};

const appSnapshotSerializer = {
  print: ({ sourceHtml, clientRenderContent }, serializer) => {
    const serializedSouceHtml = serializer(sourceHtml);
    const serializedClientRenderContent = serializer(clientRenderContent);

    const htmlDiff = diff(serializedSouceHtml, serializedClientRenderContent, {
      colors: false,
      noHeaders: true
    });

    const snapshotItems = [
      `SOURCE HTML: ${serializedSouceHtml}`,
      `POST HYDRATE DIFFS: ${htmlDiff ? `\n${htmlDiff}` : 'NO DIFF'}`
    ];

    return snapshotItems.join('\n');
  },

  test: val => {
    return (
      val &&
      val.hasOwnProperty('clientRenderContent') &&
      val.hasOwnProperty('sourceHtml')
    );
  }
};

const getAppSnapshot = async url => {
  const warnings = [];
  const errors = [];

  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'warning') {
      warnings.push(msg.text());
    }

    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  const response = await page.goto(url, { waitUntil: 'networkidle0' });
  const sourceHtml = await response.text();
  const clientRenderContent = await page.content();

  expect(warnings).toEqual([]);
  expect(errors).toEqual([]);

  return { sourceHtml, clientRenderContent };
};

module.exports = {
  appSnapshotSerializer,
  getAppSnapshot,
  cssSnapshotSerializer
};
