const diff = require('git-diff');
const prettier = require('prettier');
const css = require('css');
const diffableHtml = require('diffable-html');

const formatHtml = (html) => diffableHtml(html).trim();

const htmlSnapshotSerializer = {
  print: (html, serializer) => {
    const scripts = [];
    const styles = [];

    const extractedHtml = formatHtml(html).replace(
      /(href|src)="(.*\.(?:js|css))"/g,
      (_match, key, url) => {
        const [type, assets] = url.endsWith('.js')
          ? ['scripts', scripts]
          : ['styles', styles];

        let assetIndex = assets.indexOf(url);

        if (assetIndex === -1) {
          assetIndex = assets.push(url) - 1;
        }

        return `${key}="${type}[${assetIndex}]"`;
      },
    );

    return [
      `SCRIPTS: ${serializer(scripts)}`,
      `CSS: ${serializer(styles)}`,
      `SOURCE HTML: ${formatHtml(extractedHtml)}`,
    ].join('\n');
  },
  test: (value) =>
    typeof value === 'string' && value.startsWith('<!DOCTYPE html>'),
};

const cssSnapshotSerializer = {
  print: (value) => prettier.format(value, { parser: 'css' }),
  test: (value) => {
    try {
      css.parse(value);
    } catch (e) {
      return false;
    }
    return true;
  },
};

const appSnapshotSerializer = {
  print: ({ sourceHtml, clientRenderContent }, serializer) => {
    const formattedSourceHtml = formatHtml(sourceHtml);
    const formattedClientHtml = formatHtml(clientRenderContent);

    const htmlDiff = diff(formattedSourceHtml, formattedClientHtml, {
      colors: false,
      noHeaders: true,
    });

    const snapshotItems = [
      serializer(formattedSourceHtml),
      `POST HYDRATE DIFFS: ${htmlDiff ? `\n${htmlDiff}` : 'NO DIFF'}`,
    ];

    return snapshotItems.join('\n');
  },

  test: (val) => {
    return (
      val &&
      val.hasOwnProperty('clientRenderContent') &&
      val.hasOwnProperty('sourceHtml')
    );
  },
};

const getAppSnapshot = async (url, warningFilter = () => true) => {
  const warnings = [];
  const errors = [];

  const page = await browser.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'warning') {
      warnings.filter(warningFilter).push(msg.text());
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
  cssSnapshotSerializer,
  htmlSnapshotSerializer,
};
