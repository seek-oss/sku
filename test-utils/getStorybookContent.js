const getStorybookContent = async (url, elementSelector) => {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  const firstStoryButton = await page.waitForSelector(
    '#storybook-explorer-menu button',
  );

  // Ensure default story is activated
  await firstStoryButton.click();

  const iframeElement = await page.waitForSelector('#storybook-preview-iframe');

  const storybookFrame = await iframeElement.contentFrame();

  if (!storybookFrame) {
    console.log('Unable to find storybookFrame', storybookFrame);
    throw new Error('Unable to find iframe by id');
  }

  const element = await storybookFrame.waitForSelector(elementSelector);

  return element.evaluate((e) => ({
    text: e.innerText,
    fontSize: window.getComputedStyle(e).getPropertyValue('font-size'),
  }));
};

module.exports = { getStorybookContent };
