const env = require('./env');
const loaders = require('./loaders');
const { resolvePackage } = require('./resolvePackage');

module.exports = {
  ...env,
  ...loaders,
  resolvePackage,
};
