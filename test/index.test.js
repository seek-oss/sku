var webpack = require('webpack');
var clean = require('rimraf');
var getSubDirsSync = require('./utils/get-sub-dirs-sync');
var dirCompare = require('dir-compare');
var spawn = require('cross-spawn');

var testCases = getSubDirsSync(__dirname + '/test-cases');

describe('Test cases', function() {
  testCases.forEach(function(testCase) {
    describe(testCase, function() {
      var testCaseRoot = __dirname + '/test-cases/' + testCase;

      beforeEach(function(done) {
        clean(testCaseRoot + '/dist/', done);
      });

      it('should build as expected', function() {
        spawn.sync('node', [__dirname + '/../scripts/build'], {
          stdio: 'inherit',
          cwd: testCaseRoot
        });
        expect(
          dirCompare.compareSync(
            testCaseRoot + '/dist',
            testCaseRoot + '/expected-output',
            { compareContent: true }
          ).same
        ).toBe(true);
      });
    });
  });
});
