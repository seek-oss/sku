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
              .map(({ identifier }: { identifier: string }) => identifier)
              .filter((id: string) => externalRegex.test(id))
              .map((id: string) =>
                id.replace(externalRegex, '').replace(/"$/, ''),
              )
              .sort(),
          ),
        ];

        return JSON.stringify(externals, null, 2);
      },
    });
  }
}
