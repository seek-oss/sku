const { default: babelJest } = require('babel-jest');

const { rootResolution } = require('../../context');
const babelConfig = require('../babel/babelConfig');
const targets = require('../targets.json');

module.exports = babelJest.createTransformer(
  babelConfig({
    target: 'jest',
    rootResolution,
    browserslist: targets.browserslistNodeTarget,
  }),
);
