const { formatHtml } = require('./formatHtml');

const htmlSnapshotSerializer = {
  print: (html, serializer) => {
    const scripts = [];
    const styles = [];

    const extractedHtml = formatHtml(html).replace(
      /(href|src)="(.*\.(?:js|css))"/g,
      (_match, key, url) => {
        const [type, assets] = url.endsWith('.js')
          ? ['scripts', scripts]
          : ['styles', styles];

        let assetIndex = assets.indexOf(url);

        if (assetIndex === -1) {
          assetIndex = assets.push(url) - 1;
        }

        return `${key}="${type}[${assetIndex}]"`;
      },
    );

    return [
      `SCRIPTS: ${serializer(scripts)}`,
      `CSS: ${serializer(styles)}`,
      `SOURCE HTML: ${formatHtml(extractedHtml)}`,
    ].join('\n');
  },
  test: (value) => {
    return typeof value === 'string' && value.startsWith('<!DOCTYPE html>');
  },
};

module.exports = htmlSnapshotSerializer;
