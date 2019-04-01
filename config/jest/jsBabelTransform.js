const babelJest = require('babel-jest');
const babelConfig = require('../babel/babelConfig');

module.exports = babelJest.createTransformer(babelConfig({ target: 'jest' }));
