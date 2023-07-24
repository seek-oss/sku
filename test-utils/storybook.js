// eslint-disable-next-line spaced-comment
/// <reference lib="dom" />

/**
 * Returns the iframe of the first story at the provided storybook URL
 *
 * @param {string} storybookUrl A URL pointing to a storybook
 */
const getStorybookFrame = async (storybookUrl) => {
  const page = await browser.newPage();
  await page.goto(storybookUrl, { waitUntil: 'networkidle2' });

  const firstStoryButton = await page.waitForSelector(
    '#storybook-explorer-menu button',
    { timeout: 100_000 },
  );

  // Ensure default story is activated
  await firstStoryButton.click();

  const iframeElement = await page.waitForSelector('#storybook-preview-iframe');

  const storybookFrame = await iframeElement.contentFrame();

  if (!storybookFrame) {
    console.log('Unable to find storybookFrame', storybookFrame);
    throw new Error('Unable to find iframe by id');
  }

  return storybookFrame;
};

/**
 * Runs the provided element selector on the provided frame and returns the text content and font size of the selected element
 *
 * @param {import('puppeteer').Frame} storybookFrame The iframe of a single storybook story
 * @param {string} elementSelector An element selector for targetting a specific element within the story frame
 */
const getTextContentFromStorybookFrame = async (
  storybookFrame,
  elementSelector,
) => {
  const element = await storybookFrame.waitForSelector(elementSelector);

  return element.evaluate((e) => ({
    text: e.innerText,
    fontSize: window.getComputedStyle(e).getPropertyValue('font-size'),
  }));
};

module.exports = { getStorybookFrame, getTextContentFromStorybookFrame };
