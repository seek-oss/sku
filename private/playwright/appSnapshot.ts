import type { Page } from 'playwright';
import { expect } from 'vitest';
import { createPage } from './browser.ts';

type AppSnapshotOptions = {
  url: string;
};

const CLIENT_HTML_SETTLE_ATTEMPTS = 40;
const CLIENT_HTML_SETTLE_INTERVAL_MS = 50;

/**
 * Wait until `page.content()` is unchanged across two reads so client effects
 * (e.g. `useEffect`) and late style injection are reflected in snapshots.
 */
const waitForClientHtmlToSettle = async (page: Page) => {
  let previous = await page.content();

  for (let attempt = 0; attempt < CLIENT_HTML_SETTLE_ATTEMPTS; attempt++) {
    await page.evaluate(
      (delayMs) => new Promise<void>((resolve) => setTimeout(resolve, delayMs)),
      CLIENT_HTML_SETTLE_INTERVAL_MS,
    );
    const current = await page.content();
    if (current === previous) {
      return current;
    }
    previous = current;
  }

  return previous;
};

export const getAppSnapshot = async ({ url }: AppSnapshotOptions) => {
  const page = await createPage();

  const warnings: string[] = [];
  const errors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.location().url.includes('favicon.ico')) {
      errors.push(msg.text());
    }

    if (msg.type() === 'warning') {
      warnings.push(msg.text());
    }
  });

  const response = await page.goto(url);

  const headers = (await response?.allHeaders()) ?? {};
  const sourceHtml = (await response?.text()) || '';
  const clientRenderContent = await waitForClientHtmlToSettle(page);
  await page.close();

  expect(errors).toEqual([]);
  expect(warnings).toEqual([]);

  return { headers, sourceHtml, clientRenderContent };
};

export type AppSnapshot = Awaited<ReturnType<typeof getAppSnapshot>>;
export const isAppSnapshot = (value: unknown): value is AppSnapshot =>
  typeof value === 'object' &&
  value !== null &&
  'headers' in value &&
  'sourceHtml' in value &&
  'clientRenderContent' in value;
