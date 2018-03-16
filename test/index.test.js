const { promisify } = require('es6-promisify');
const webpack = require('webpack');
const rimrafAsync = promisify(require('rimraf'));
const getSubDirsSync = require('./utils/getSubDirsSync');
const dirContentsToObject = require('./utils/dirContentsToObject');
const dirCompare = require('dir-compare');
const { exec } = require('child-process-promise');

getSubDirsSync(__dirname + '/test-cases').forEach(testCaseName => {
  describe(testCaseName, () => {
    const testCaseRoot = __dirname + '/test-cases/' + testCaseName;

    beforeAll(async () => {
      await rimrafAsync(testCaseRoot + '/dist/');
      await exec(`node ${__dirname}/../scripts/build`, { cwd: testCaseRoot });
    });

    it('should generate the expected files', async () => {
      const files = await dirContentsToObject(testCaseRoot + '/dist');
      expect(files).toMatchSnapshot();
    });
  });
});
