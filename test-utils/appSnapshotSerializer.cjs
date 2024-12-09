// @ts-check
const diff = require('git-diff');
const { formatHtml } = require('./formatHtml.cjs');

const appSnapshotSerializer = {
  /**
   * @param {{sourceHtml: string, clientRenderContent: string}} html
   * @param {(s: unknown) => string} serializer
   */
  print: ({ sourceHtml, clientRenderContent }, serializer) => {
    const formattedSourceHtml = formatHtml(sourceHtml);
    const formattedClientHtml = formatHtml(clientRenderContent);

    const htmlDiff = diff(formattedSourceHtml, formattedClientHtml, {
      color: false,
      noHeaders: true,
    });

    const snapshotItems = [
      serializer(formattedSourceHtml),
      `POST HYDRATE DIFFS: ${htmlDiff ? `\n${htmlDiff}` : 'NO DIFF'}`,
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
