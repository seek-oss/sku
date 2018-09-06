const path = require('path');

module.exports = {
  setupTestFrameworkScriptFile: path.resolve(
    __dirname,
    'test/utils/jestSetup.js'
  ),
  testURL: 'http://localhost',
  testMatch: ['**/*.test.js', 'test/test-cases/*/*.test.js']
};
