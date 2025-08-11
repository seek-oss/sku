import type { SnapshotSerializer } from 'vitest';
import { createTwoFilesPatch } from 'diff';
import { formatHtml } from './formatHtml.ts';
import { sanitizeString } from './sanitizeString.ts';

const emptyDiff = `===================================================================
--- sourceHtml
+++ clientHtml`;

/**
 * Serializes the output of `getAppSnapshot`, formatting the HTML and diffing the pre and
 * post-hydration HTML
 */
export const appSnapshotSerializer: SnapshotSerializer = {
  serialize: ({ sourceHtml, clientRenderContent }) => {
    const formattedSourceHtml = formatHtml(sourceHtml);
    const formattedClientHtml = formatHtml(clientRenderContent);

    const htmlDiff = createTwoFilesPatch(
      'sourceHtml',
      'clientHtml',
      formattedSourceHtml,
      formattedClientHtml,
      undefined,
      undefined,
      { ignoreNewlineAtEof: true, context: 3 },
    ).trim();

    const isEmptyDiff = htmlDiff === emptyDiff;

    const snapshotItems = [
      formattedSourceHtml,
      `POST HYDRATE DIFFS: ${isEmptyDiff ? 'NO DIFF' : `\n${htmlDiff}`}`,
    ];

    return sanitizeString(snapshotItems.join('\n'));
  },

  test: (val) =>
    val &&
    val.hasOwnProperty('clientRenderContent') &&
    val.hasOwnProperty('sourceHtml'),
};
