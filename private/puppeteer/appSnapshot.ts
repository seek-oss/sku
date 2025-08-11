import type { ExpectStatic } from 'vitest';
import { TEST_TIMEOUT } from '@sku-private/test-utils/constants';

export const getAppSnapshot = async ({
  url,
  warningFilter = () => true,
  expect,
  waitUntil = 'networkidle0',
  timeout = TEST_TIMEOUT,
}: {
  url: string;
  warningFilter?: (warning: string) => boolean;
  expect: ExpectStatic;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
  timeout?: number;
}) => {
  const warnings: string[] = [];
  const errors: string[] = [];

  const appPage = await browser.newPage();
  appPage.setDefaultNavigationTimeout(timeout);

  appPage.on('console', (msg) => {
    if (msg.type() === 'warn') {
      warnings.filter(warningFilter).push(msg.text());
    }

    if (msg.type() === 'error') {
      let isFaviconError = false;
      msg.stackTrace().forEach((frame) => {
        // Ignore 404s for favicons
        if (frame?.url?.endsWith('favicon.ico')) {
          isFaviconError = true;
          return;
        }

        errors.push(`${frame.url}:${frame.lineNumber}:${frame.columnNumber}`);
      });

      if (isFaviconError) {
        return;
      }

      errors.push(msg.text());
    }
  });

  try {
    const response = await appPage.goto(url, {
      waitUntil,
    });
    const sourceHtml = (await response?.text()) || '';
    const clientRenderContent = await appPage.content();

    expect(warnings).toEqual([]);
    expect(errors).toEqual([]);

    return { sourceHtml, clientRenderContent };
  } finally {
    await appPage.close();
  }
};
