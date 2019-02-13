const LineDiff = require('line-diff');

const getLineDiff = (html1, html2) => {
  const diffs = [];
  const lineBuffer = 3;

  const changes = new LineDiff(html1, html2).changes;

  let bufferCount = lineBuffer;
  let currentDiff = null;

  changes.forEach((change, index) => {
    if (currentDiff && !change.modified) {
      bufferCount--;
      currentDiff.push(change);
    }

    if (change.modified) {
      bufferCount = lineBuffer;
    }

    if (!currentDiff && change.modified) {
      const bufferStart = index - bufferCount > 0 ? index - bufferCount : 0;
      const previousBuffer = [...changes].splice(bufferStart, bufferCount);
      currentDiff = [...previousBuffer, change];
    }

    if (bufferCount === 0) {
      diffs.push(currentDiff);
      bufferCount = lineBuffer;
      currentDiff = null;
    }
  });

  return diffs
    .map(diff =>
      diff
        .map(change => {
          if (change.modified) {
            const [indent] = change._[0].match(/^(\s*)/);

            const stringDiff = [
              `${indent}-${change._[0].trim()}`,
              `${indent}+${change._[1].trim()}`
            ];

            console.log(stringDiff);

            return stringDiff.join('\n');
          }

          return change._[0];
        })
        .join('\n')
    )
    .join('===============================================\n');
};

const appSnapshotSerializer = {
  print: (
    { sourceHtml, clientRenderContent, warnings, errors },
    serializer
  ) => {
    const serializedSouceHtml = serializer(sourceHtml);
    const serializedClientRenderContent = serializer(clientRenderContent);

    const htmlDiff = getLineDiff(
      serializedSouceHtml,
      serializedClientRenderContent
    );

    const snapshotItems = [
      `SOURCE HTML: ${serializedSouceHtml}`,
      `POST HYDRATE DIFFS: \n${htmlDiff}`,
      `WARNINGS: ${serializer(warnings)}`,
      `ERRORS: ${serializer(errors)}`
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

  const response = await page.goto(url);
  const sourceHtml = await response.text();
  const clientRenderContent = await page.content();

  return { sourceHtml, clientRenderContent, warnings, errors };
};

module.exports = {
  appSnapshotSerializer,
  getAppSnapshot
};
