import { StatsWriterPlugin } from 'webpack-stats-plugin';

const externalRegex = /^external node-commonjs "/;

export class ListExternalsWebpackPlugin {
  constructor({ filename = 'externals.json' } = {}) {
    return new StatsWriterPlugin({
      filename,
      fields: ['modules'],
      transform({ modules }) {
        const externals = [
          ...new Set(
            modules
              .map(({ identifier }) => identifier)
              .filter((id) => externalRegex.test(id))
              .map((id) => id.replace(externalRegex, '').replace(/"$/, ''))
              .sort(),
          ),
        ];

        return JSON.stringify(externals, null, 2);
      },
    });
  }
}
