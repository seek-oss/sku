const { StatsWriterPlugin } = require('webpack-stats-plugin');
const uniq = require('lodash/uniq');

module.exports = class ListExternalsWebpackPlugin {
  constructor({ filename = 'externals.json' } = {}) {
    return new StatsWriterPlugin({
      filename,
      fields: ['modules'],
      transform({ modules }) {
        const identifiers = uniq(
          modules
            .map(({ identifier }) => identifier)
            .filter(id => /^external /.test(id))
            .map(id => id.replace(/^external /, ''))
            .sort()
        );

        return JSON.stringify(identifiers, null, 2);
      }
    });
  }
};
