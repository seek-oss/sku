import { formatHtml } from './formatHtml.ts';

import type { SnapshotSerializer } from 'vitest';

/**
 * Typically used to serialize the result of `dirContentsToObject`. It groups assets by type, and
 * formats CSS and HTML asset contents.
 */
export const htmlSnapshotSerializer: SnapshotSerializer = {
  print: (html, serializer) => {
    const assets: { SCRIPTS: string[]; CSS: string[] } = {
      SCRIPTS: [],
      CSS: [],
    };

    if (typeof html !== 'string') {
      throw new Error(
        `htmlSnapshotSerializer expected a string, received ${typeof html}`,
      );
    }

    const extractedHtml = formatHtml(html).replace(
      /(href|src)="(.*\.(?:js|css))"/g,
      (_match, key, url) => {
        const assetType = url.endsWith('.js') ? 'SCRIPTS' : 'CSS';

        let assetIndex = assets[assetType].indexOf(url);
        if (assetIndex === -1) {
          assetIndex = assets[assetType].push(url) - 1;
        }

        return `${key}="${assetType}[${assetIndex}]"`;
      },
    );

    return [
      `SCRIPTS: ${serializer(assets.SCRIPTS)}`,
      `CSS: ${serializer(assets.CSS)}`,
      `SOURCE HTML: ${formatHtml(extractedHtml)}`,
    ].join('\n');
  },
  test: (value) =>
    typeof value === 'string' && value.startsWith('<!DOCTYPE html>'),
};
