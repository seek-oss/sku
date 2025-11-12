import { expect } from 'vitest';
import { createPage } from './browser.ts';

type AppSnapshotOptions = {
  url: string;
};

export const getAppSnapshot = async ({ url }: AppSnapshotOptions) => {
  const page = await createPage();

  const errors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  const response = await page.goto(url);

  const sourceHtml = (await response?.text()) || '';
  const clientRenderContent = await page.content();
  await page.close();

  expect(errors).toEqual([]);

  return { sourceHtml, clientRenderContent };
};
