// eslint-disable-next-line spaced-comment
/// <reference lib="dom" />

/**
 * Returns the page for the given story iframe URL
 *
 * @param {string} storybookUrl A URL pointing to a storybook
 */
export const getStoryPage = async (storyIframeUrl) => {
  const storyPage = await browser.newPage();
  storyPage.setDefaultNavigationTimeout(10_000);

  await storyPage.goto(storyIframeUrl, { waitUntil: ['load'] });

  return storyPage;
};

/**
 * Returns the iframe of the first story at the provided storybook URL
 *
 * @param {string} storybookUrl A URL pointing to a storybook
 */
export const getStoryFrame = async (storybookUrl) => {
  const storybookPage = await browser.newPage();
  storybookPage.setDefaultNavigationTimeout(10_000);

  await storybookPage.goto(storybookUrl, { waitUntil: ['load'] });

  const firstStoryButton = await storybookPage.waitForSelector(
    '#storybook-explorer-menu button',
    { timeout: 10_000 },
  );

  // Ensure default story is activated
  await firstStoryButton.click();

  const iframeElement = await storybookPage.waitForSelector(
    '#storybook-preview-iframe',
  );

  const storyFrame = await iframeElement.contentFrame();

  if (!storyFrame) {
    console.log('Unable to find storybookFrame', storyFrame);
    throw new Error('Unable to find iframe by id');
  }

  return storyFrame;
};

/**
 * Runs the provided element selector on the provided frame and returns the text content and font size of the selected element
 *
 * @param {import('puppeteer').Page | import('puppeteer').Frame} frameOrPage The iframe or page of a storybook story
 * @param {string} elementSelector An element selector for targetting a specific element within the story frame
 */
export const getTextContentFromFrameOrPage = async (
  frameOrPage,
  elementSelector,
) => {
  const element = await frameOrPage.waitForSelector(elementSelector, {
    timeout: 10_000,
  });

  return element.evaluate((e) => ({
    text: e.innerText,
    fontSize: window.getComputedStyle(e).getPropertyValue('font-size'),
  }));
};
