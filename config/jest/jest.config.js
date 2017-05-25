module.exports = {
  testPathIgnorePatterns: ['<rootDir>[/\\\\](dist|node_modules)[/\\\\]'],
  moduleNameMapper: {
    '\(seek-style-guide\/react|\.(css|less)$)': require.resolve(
      'identity-obj-proxy'
    )
  },
  transform: {
    '^.+\\.js$': require.resolve('./babelTransform.js')
  }
};
