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

  const response = await page.goto(url, { waitUntil: 'load' });
  const sourceHtml = await response.text();
  const clientRenderContent = await page.content();

  expect(warnings).toEqual([]);
  expect(errors).toEqual([]);

  return { sourceHtml, clientRenderContent };
};

module.exports = {
  getAppSnapshot,
};
