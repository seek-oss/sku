const puppeteer = require('puppeteer');

module.exports = async url => {
  const warnings = [];
  const errors = [];

  const browser = await puppeteer.launch();
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
  const content = await page.content();

  await browser.close();

  return { sourceHtml, content, warnings, errors };
};
