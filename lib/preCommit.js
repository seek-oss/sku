const lintStaged = require('lint-staged');
const configPath = require.resolve('../config/lintStaged/lintStagedConfig');

module.exports = async () => await lintStaged({ configPath });
