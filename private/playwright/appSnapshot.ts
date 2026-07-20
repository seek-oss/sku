import { expect } from 'vitest';
import { createPage } from './browser.ts';

type AppSnapshotOptions = {
  url: string;
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
  const clientRenderContent = await page.content();
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
