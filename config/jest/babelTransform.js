const babelJest = require('babel-jest');
const babelConfig = require('../babel/babel.config');

module.exports = babelJest.createTransformer(babelConfig({ webpack: false }));
