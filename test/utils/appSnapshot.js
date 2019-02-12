const appSnapshotSerializer = {
  print: (
    { sourceHtml, clientRenderContent, warnings, errors },
    serializer
  ) => {
    const snapshotItems = [
      `SOURCE HTML: ${serializer(sourceHtml)}`,
      `CLIENT RENDER CONTENT: ${serializer(clientRenderContent)}`
    ];

    if (warnings.length > 0) {
      snapshotItems.push(`WARNINGS: ${serializer(warnings)}`);
    }

    if (errors.length > 0) {
      snapshotItems.push(`ERRORS: ${serializer(errors)}`);
    }

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
