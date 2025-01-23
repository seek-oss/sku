import { createRequire } from 'node:module';
import { getClosingHtml, getOpeningHtml } from '@/services/vite/createIndex.js';
import type { Plugin } from 'vite';

export const skuGenerateIndexPlugin = () =>
  ({
    name: 'vite-plugin-sku-generate-index',
    apply: 'build',
    transformIndexHtml: {
      order: 'pre',
      handler: () => {
        const require = createRequire(import.meta.url);
        const clientEntry = require.resolve('../entries/vite-client.jsx');
        const startHtml = getOpeningHtml({
          headTags: '',
        });
        const endHtml = getClosingHtml({
          bodyTags: `<script type="module" src="${clientEntry}"></script>`,
        });

        return `${startHtml}${endHtml}`;
      },
    },
  }) satisfies Plugin;
