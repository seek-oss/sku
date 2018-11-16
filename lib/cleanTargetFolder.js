const { promisify } = require('util');
const rimraf = promisify(require('rimraf'));

const { paths } = require('../context');

module.exports = () => rimraf(`${paths.target}/*`);
