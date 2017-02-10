module.exports = {
  testPathIgnorePatterns: [
    '<rootDir>[/\\\\](dist|node_modules|sku)[/\\\\]'
  ],
  'moduleNameMapper': {
    '\\.(css|less)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.(js|jsx)$': require.resolve('./babelTransform.js')
  },
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\].+\\.(js|jsx)$'
  ]
};
