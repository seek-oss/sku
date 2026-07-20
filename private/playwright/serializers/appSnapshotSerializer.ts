import type { SnapshotSerializer } from 'vitest';
import { createTwoFilesPatch } from 'diff';
import { type AppSnapshot, isAppSnapshot } from '../appSnapshot.ts';
import { formatHtml } from '../formatHtml.ts';
import { sanitizeString } from '../sanitizeString.ts';

const snapshotHeaders = new Set([
  'content-security-policy',
  'content-security-policy-report-only',
]);

const emptyDiff = `===================================================================
--- sourceHtml
+++ clientHtml`;

/**
 * Serializes the output of `getAppSnapshot`, formatting the HTML and diffing the pre and
 * post-hydration HTML
 */
export const appSnapshotSerializer: SnapshotSerializer = {
  serialize: ({ headers, sourceHtml, clientRenderContent }: AppSnapshot) => {
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
    const snapshot = sanitizeString(
      htmlDiff === emptyDiff
        ? [emptyDiff, formattedSourceHtml].join('\n')
        : htmlDiff,
    );

    const preamble = Object.entries(headers)
      .filter(([key]) => snapshotHeaders.has(key))
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    return preamble ? [preamble, snapshot].join('\n') : snapshot;
  },

  test: isAppSnapshot,
};
