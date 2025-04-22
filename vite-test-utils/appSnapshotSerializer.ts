import type { SnapshotSerializer } from 'vitest';
import { createTwoFilesPatch } from 'diff';
import diffableHtml from 'diffable-html';

const formatHtml = (html: string) => diffableHtml(html).trim();

const emptyDiff = `===================================================================
--- sourceHtml
+++ clientHtml`;

const appSnapshotSerializer: SnapshotSerializer = {
  serialize: (
    { sourceHtml, clientRenderContent },
    config,
    indentation,
    depth,
    refs,
    printer,
  ) => {
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
      printer(formattedSourceHtml, config, indentation, depth, refs),
      `POST HYDRATE DIFFS: ${isEmptyDiff ? 'NO DIFF' : `\n${htmlDiff}`}`,
    ];

    return snapshotItems.join('\n');
  },

  test: (val) =>
    val &&
    val.hasOwnProperty('clientRenderContent') &&
    val.hasOwnProperty('sourceHtml'),
};

export default appSnapshotSerializer;
