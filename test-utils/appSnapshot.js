const getAppSnapshot = async (url, warningFilter = () => true) => {
  const warnings = [];
  const errors = [];

  const appPage = await browser.newPage();

  appPage.on('console', (msg) => {
    if (msg.type() === 'warning') {
      warnings.filter(warningFilter).push(msg.text());
    }

    if (msg.type() === 'error') {
      let isFaviconError = false;
      msg.stackTrace().forEach((frame) => {
        // Ignore 404s for favicons
        if (frame.url.endsWith('favicon.ico')) {
          isFaviconError = true;
          return;
        }

        errors.push(`${frame.url}:${frame.lineNumber}:${frame.columnNumber}`);
      });

      if (isFaviconError) {
        return;
      }

      errors.push(msg.text());
    }
  });

  const response = await appPage.goto(url, { waitUntil: 'load' });
  const sourceHtml = await response.text();
  const clientRenderContent = await appPage.content();

  expect(warnings).toEqual([]);
  expect(errors).toEqual([]);

  return { sourceHtml, clientRenderContent };
};

module.exports = {
  getAppSnapshot,
};
