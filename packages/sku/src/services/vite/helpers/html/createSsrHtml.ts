import { getClosingHtml, getOpeningHtml } from './createIndex.js';
import { serializeConfig } from '../serializeConfig.js';
import type { ViteDevServer } from 'vite';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export const createSsrHtml = async ({
  vite,
  render,
  site,
  url,
  isDev,
}: {
  vite?: ViteDevServer;
  render: any;
  site: any;
  url: string;
  isDev: boolean;
}) => {
  const clientContext = render.provideClientContext
    ? await render.provideClientContext({
        site,
        url,
      })
    : {};

  // Always read fresh template in development
  let html = getOpeningHtml({
    title: 'Sku Project',
    headTags: '<!-- head tags -->',
  });

  html += '<!-- app tags -->';

  const bodyTags = [
    isDev
      ? `<script type="module" src="${require.resolve('../../entries/vite-client.js')}"></script>\n`
      : '',
    `${serializeConfig(clientContext)}<!-- body tags -->`,
  ].join('');

  html += getClosingHtml({
    bodyTags,
  });

  return (isDev ? await vite?.transformIndexHtml(url, html) : html) || '';
};
