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

  let response = await page.goto(url, { waitUntil: 'load' });
  if (response.status() === 404) {
    // Wait a bit and retry to account for inconsistent behavior in CI
    await new Promise((resolve) => {
      setTimeout(resolve, 2_000);
    });
    response = await page.goto(url, { waitUntil: 'load' });
  }
  const sourceHtml = await response.text();
  const clientRenderContent = await page.content();

  expect(warnings).toEqual([]);
  expect(errors).toEqual([]);

  return { sourceHtml, clientRenderContent };
};

module.exports = {
  getAppSnapshot,
};
