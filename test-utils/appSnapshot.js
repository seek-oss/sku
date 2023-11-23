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
  console.log({ status: response.status() });
  if (response.status() === 404) {
    const delay = 10_000;
    console.log(`Received 404, retrying in ${delay} ms`);
    // Wait a bit and retry to account for inconsistent behavior in CI
    await new Promise((resolve) => {
      setTimeout(resolve, delay);
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
