const babelJest = require('babel-jest');
const babelConfig = require('../babel/babelConfig');
const builds = require('../builds');

const decorator = builds[0].babelDecorator || (config => config);

module.exports = babelJest.createTransformer(
  decorator(babelConfig({ target: 'node' }))
);
