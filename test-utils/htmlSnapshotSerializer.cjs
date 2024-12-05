// @ts-check
const { formatHtml } = require("./formatHtml.cjs");

const htmlSnapshotSerializer = {
  /**
   * @param {string} html
   * @param {(s: unknown) => string} serializer
   */
  print: (html, serializer) => {
    /** @type {unknown[]} */
    const scripts = [];
    /** @type {unknown[]} */
    const styles = [];

    const extractedHtml = formatHtml(html).replace(
      /(href|src)="(.*\.(?:js|css))"/g,
      (_match, key, url) => {
        const [type, assets] = url.endsWith(".js")
          ? ["scripts", scripts]
          : ["styles", styles];

        let assetIndex = assets.indexOf(url);

        if (assetIndex === -1) {
          assetIndex = assets.push(url) - 1;
        }

        return `${key}="${type}[${assetIndex}]"`;
      }
    );

    return [
      `SCRIPTS: ${serializer(scripts)}`,
      `CSS: ${serializer(styles)}`,
      `SOURCE HTML: ${formatHtml(extractedHtml)}`,
    ].join("\n");
  },
  /** @param {string} value */
  test: (value) => {
    return typeof value === "string" && value.startsWith("<!DOCTYPE html>");
  },
};

module.exports = htmlSnapshotSerializer;
