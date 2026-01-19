import type { SnapshotSerializer } from 'vitest';
import { createTwoFilesPatch } from 'diff';
import { formatHtml } from '../formatHtml.ts';
import { sanitizeString } from '../sanitizeString.ts';

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
      { ignoreWhitespace: true, context: Infinity },
    ).trim();

    // If there is no difference between the source and client html then we can just return the source html
    return sanitizeString(
      htmlDiff === emptyDiff
        ? [emptyDiff, formattedSourceHtml].join('\n')
        : htmlDiff,
    );
  },

  test: (val) =>
    val &&
    val.hasOwnProperty('clientRenderContent') &&
    val.hasOwnProperty('sourceHtml'),
};
