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
export const makeStableViteHashes = () => ({
  build: {
    rollupOptions: {
      output: {
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]',
        entryFileNames: '[name].js',
      },
    },
  },
});
