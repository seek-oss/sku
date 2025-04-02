export const getAppSnapshot = async (
  url: string,
  warningFilter = () => true,
) => {
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

  const response = await appPage.goto(url, { waitUntil: 'load' });
  const sourceHtml = sanitizeHtml((await response?.text()) || '');
  await appPage.waitForNetworkIdle();
  const clientRenderContent = sanitizeHtml(await appPage.content());

  expect(warnings).toEqual([]);
  expect(errors).toEqual([]);

  return { sourceHtml, clientRenderContent };
};

function sanitizeHtml(str: string) {
  return str.replaceAll(process.cwd(), '{cwd}');
}
