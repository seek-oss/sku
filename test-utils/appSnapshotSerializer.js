const diff = require('git-diff');
const { formatHtml } = require('./formatHtml');

const appSnapshotSerializer = {
  print: ({ sourceHtml, clientRenderContent }, serializer) => {
    const formattedSourceHtml = formatHtml(sourceHtml);
    const formattedClientHtml = formatHtml(clientRenderContent);

    const htmlDiff = diff(formattedSourceHtml, formattedClientHtml, {
      colors: false,
      noHeaders: true,
    });

    const snapshotItems = [
      serializer(formattedSourceHtml),
      `POST HYDRATE DIFFS: ${htmlDiff ? `\n${htmlDiff}` : 'NO DIFF'}`,
    ];

    return snapshotItems.join('\n');
  },

  test: (val) =>
    val &&
    val.hasOwnProperty('clientRenderContent') &&
    val.hasOwnProperty('sourceHtml'),
};

module.exports = appSnapshotSerializer;
