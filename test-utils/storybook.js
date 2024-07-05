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
