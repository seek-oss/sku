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
