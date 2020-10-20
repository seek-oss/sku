const babelJest = require('babel-jest');

const { isCompilePackage } = require('../../context');
const babelConfig = require('../babel/babelConfig');

module.exports = babelJest.createTransformer(
  babelConfig({ target: 'jest', rootResolution: !isCompilePackage }),
);
