const { default: babelJest } = require('babel-jest');

const { rootResolution } = require('../../context');
const babelConfig = require('../babel/babelConfig');

module.exports = babelJest.createTransformer(
  babelConfig({
    target: 'jest',
    lang: 'ts',
    rootResolution,
    browserslist: 'current node',
  }),
);
