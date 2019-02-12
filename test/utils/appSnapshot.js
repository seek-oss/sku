const LineDiff = require('line-diff');

const appSnapshotSerializer = {
  print: (
    { sourceHtml, clientRenderContent, warnings, errors },
    serializer
  ) => {
    const serializedSouceHtml = serializer(sourceHtml);
    const serializedClientRenderContent = serializer(clientRenderContent);

    const htmlDiff = new LineDiff(
      serializedSouceHtml,
      serializedClientRenderContent
    );

    console.log(JSON.stringify(htmlDiff.changes, null, 2));

    const snapshotItems = [
      `SOURCE HTML: ${serializedSouceHtml}`,
      `WARNINGS: ${serializer(warnings)}`,
      `POST HYDRATE DIFF: ${htmlDiff.toString()}`,
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
