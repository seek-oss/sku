module.exports = {
  prettierPath: require.resolve('prettier'),
  testPathIgnorePatterns: ['<rootDir>[/\\\\](dist|node_modules)[/\\\\]'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|svg)$': require.resolve(
      './fileMock'
    )
  },
  transform: {
    '^.+\\.css\\.js$': require.resolve('./cssJsTransform.js'),
    '(seek-style-guide/react|.(css|less)$)': require.resolve(
      './cssModulesTransform.js'
    ),
    // Match any `.js` file that isn't a `.css.js` file.
    // We do this by asserting the 4 characters before `.js` aren't `.css`
    // or that it has fewer than 4 characters (e.g. `foo.js`)
    '((?!(\\.css)).{4}|^.{1,3})(\\.js)': require.resolve('./babelTransform.js')
  },
  testURL: 'http://localhost' // @see https://github.com/facebook/jest/issues/6766
};
