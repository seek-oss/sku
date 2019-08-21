const { existsSync } = require('fs');
const { getPathFromCwd } = require('./cwd');

const isYarn = existsSync(getPathFromCwd('yarn.lock'));

module.exports = isYarn;
