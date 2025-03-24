// @ts-check
const diff = require('diff');
const { formatHtml } = require('./formatHtml.cjs');

const emptyDiff = `===================================================================
--- sourceHtml
+++ clientHtml`;

const appSnapshotSerializer = {
  /**
   * @param {{sourceHtml: string, clientRenderContent: string}} html
   * @param {(s: unknown) => string} serializer
   */
  print: ({ sourceHtml, clientRenderContent }, serializer) => {
    const formattedSourceHtml = formatHtml(sourceHtml);
    const formattedClientHtml = formatHtml(clientRenderContent);

    const htmlDiff = Diff.createTwoFilesPatch(
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
      serializer(formattedSourceHtml),
      `POST HYDRATE DIFFS: ${isEmptyDiff ? 'NO DIFF' : `\n${htmlDiff}`}`,
    ];

    return snapshotItems.join('\n');
  },

  /** @param {unknown} val */
  test: (val) =>
    val &&
    val.hasOwnProperty('clientRenderContent') &&
    val.hasOwnProperty('sourceHtml'),
};

module.exports = appSnapshotSerializer;
