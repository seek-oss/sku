import type { ExpectStatic } from 'vitest';

function sanitizeHtml(str: string) {
  return str.replaceAll(process.cwd(), '{cwd}');
}

export const getAppSnapshot = async ({
  url,
  warningFilter = () => true,
  expect,
}: {
  url: string;
  warningFilter?: (warning: string) => boolean;
  expect: ExpectStatic;
}) => {
  const warnings: string[] = [];
  const errors: string[] = [];

  const appPage = await browser.newPage();

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

  const response = await appPage.goto(url, { waitUntil: 'networkidle0' });
  const sourceHtml = sanitizeHtml((await response?.text()) || '');
  await appPage.waitForNetworkIdle();
  const clientRenderContent = sanitizeHtml(await appPage.content());

  await appPage.close();

  expect(warnings).toEqual([]);
  expect(errors).toEqual([]);

  return { sourceHtml, clientRenderContent };
};
