/**
 * A helper to make stable hashes for webpack.
 */
export const makeStableHashes = (config: Record<string, any>) => {
  // Addresses an issue where module IDs were different between local dev and CI
  config.optimization.chunkIds = 'natural';
  config.optimization.moduleIds = 'natural';

  // Disable hashes
  if (config.output.filename?.includes('[contenthash]')) {
    config.output.filename = '[name].js';
  }
  if (config.output.chunkFilename?.includes('[contenthash]')) {
    config.output.chunkFilename = '[name].chunk.js';
  }

  return config;
};

/**
 * A helper for vite to make stable hashes.
 */
export const makeStableViteHashes = () => {
  // ssr and client environments must share the same asset and chunk names to ensure files emitted
  // during the client build match asset and chunk names reference by static HTML
  const sharedOutputFileNames = {
    chunkFileNames: '[name].js',
    assetFileNames: '[name][extname]',
  };

  return {
    // Order of environments is aligned with sku's `buildPlugin` to ensure the render entrypoint isn't
    // cleaned up by Vite before pre-rendering
    environments: {
      client: {
        build: {
          rolldownOptions: {
            output: {
              entryFileNames: '[name].js',
              ...sharedOutputFileNames,
            },
          },
        },
      },
      ssr: {
        build: {
          rolldownOptions: {
            output: sharedOutputFileNames,
          },
        },
      },
    },
  };
};
