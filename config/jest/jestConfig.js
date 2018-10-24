module.exports = {
  prettierPath: require.resolve('prettier'),
  testPathIgnorePatterns: ['<rootDir>[/\\\\](dist|node_modules)[/\\\\]'],
  moduleFileExtensions: ['js', 'ts', 'tsx'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|svg)$': require.resolve(
      './fileMock'
    ),

    // Mock out all design system components with strings,
    // using a proxy object that echoes back the import name,
    // e.g. `import { Text } from 'seek-style-guide/react'` resolves
    // to the string 'Text'. This way, snapshot tests won't break when
    // these packages get updated, which happens regularly. There's
    // still room for debate about whether this is a good idea or not...
    '^seek-style-guide/react': require.resolve('identity-obj-proxy'),
    '^seek-asia-style-guide/react': require.resolve('identity-obj-proxy'),
    '^braid-design-system': require.resolve('identity-obj-proxy')
  },
  transform: {
    '^.+\\.css\\.js$': require.resolve('./cssJsTransform.js'),
    '\\.(css|less)$': require.resolve('./cssModulesTransform.js'),

    // Match any `.js`, `.ts` or `.tsx` file that isn't a `.css.js` file.
    // We do this by asserting the 4 characters before `.js` aren't `.css`
    // or that it has fewer than 4 characters (e.g. `foo.js`)
    '((?!(\\.css)).{4}|^.{1,3})\\.js': require.resolve('./jsBabelTransform.js'),
    '((?!(\\.css)).{4}|^.{1,3})(\\.ts|\\.tsx)': require.resolve(
      './tsBabelTransform.js'
    )
  },
  testURL: 'http://localhost' // @see https://github.com/facebook/jest/issues/6766
};
