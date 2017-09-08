module.exports = {
  generateJestConfig: overrideConfig => {
    return {
      testPathIgnorePatterns: ['<rootDir>[/\\\\](dist|node_modules)[/\\\\]'],
      moduleNameMapper: {
        '(seek-style-guide/react|.(css|less)$)': require.resolve(
          'identity-obj-proxy'
        ),
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|svg)$': require.resolve(
          './fileMock'
        )
      },
      transform: {
        '^.+\\.js$': require.resolve('./babelTransform.js')
      },
      ...overrideConfig
    };
  }
};
