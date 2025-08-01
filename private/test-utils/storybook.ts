// eslint-disable-next-line spaced-comment
/// <reference lib="dom" />
import 'vitest-puppeteer';

import { type Page, Frame } from 'puppeteer';

/**
 * Returns the page for the given story iframe URL
 */
export const getStoryPage = async (
  /** A URL pointing to a storybook iframe */
  storyIframeUrl: string,
  { docs }: { docs: boolean } = { docs: false },
) => {
  const storyPage = await browser.newPage();
  storyPage.setDefaultNavigationTimeout(10_000);

  await storyPage.goto(storyIframeUrl, { waitUntil: ['load'] });

  if (docs) {
    // If the story is a docs page, we need to wait for the docs content to load
    await storyPage.waitForSelector('#storybook-docs > * ', {
      timeout: 10_000,
    });
  } else {
    // For regular stories, we wait for the story contents to load
    await storyPage.waitForSelector('#storybook-root > *', {
      timeout: 10_000,
    });
  }

  return storyPage;
};

/**
 * Runs the provided element selector on the provided frame and returns the text content and font size of the selected element
 */
export const getTextContentFromFrameOrPage = async (
  /** The iframe or page of a storybook story */
  frameOrPage: Page | Frame,
  /** An element selector for targetting a specific element within the story frame*/
  elementSelector: string,
  { logDebugScreenshot = false } = {},
) => {
  if (logDebugScreenshot) {
    const page =
      frameOrPage instanceof Frame ? frameOrPage.page() : frameOrPage;

    console.log(
      `data:image/png;base64, ${page.screenshot({ encoding: 'base64' })}`,
    );
  }

  const element = await frameOrPage.waitForSelector(elementSelector, {
    timeout: 10_000,
  });

  if (!element) {
    throw new Error(
      `Element selector ${elementSelector} failed to find element`,
    );
  }

  return element.evaluate((e) => ({
    text: e.textContent,
    fontSize: window.getComputedStyle(e).getPropertyValue('font-size'),
  }));
};
