import { createPage } from './browser.ts';

/**
 * Runs the provided element selector on the provided frame and returns the text content and font size of the selected element
 */
export const getTextContent = async (
  storyIframeUrl: string,
  /** An element selector for targetting a specific element within the story frame*/
  elementSelector: string,
) => {
  const page = await createPage();
  await page.goto(storyIframeUrl);

  const element = await page.locator(elementSelector);

  if (!element) {
    throw new Error(
      `Element selector ${elementSelector} failed to find element`,
    );
  }

  const text = await element.textContent();
  const fontSize = await element.evaluate((e) =>
    window.getComputedStyle(e).getPropertyValue('font-size'),
  );

  await page.close();

  return { text, fontSize };
};
