var webpack = require('webpack');
var rimraf = require('rimraf');
var getSubDirsSync = require('./utils/get-sub-dirs-sync');
var dirCompare = require('dir-compare');
var spawn = require('cross-spawn');

var testCases = getSubDirsSync(__dirname + '/test-cases');

describe('Test cases', function() {
  testCases.forEach(function(testCase) {
    describe(testCase, function() {
      var testCaseRoot = __dirname + '/test-cases/' + testCase;

      beforeAll(function() {
        rimraf.sync(testCaseRoot + '/dist/');

        spawn.sync('node', [__dirname + '/../scripts/build'], {
          stdio: 'inherit',
          cwd: testCaseRoot
        });
      });

      it('should build HTML and CSS', function() {
        expect(
          dirCompare.compareSync(
            testCaseRoot + '/dist',
            testCaseRoot + '/expected-output',
            {
              includeFilter: '*.html, *.css',
              compareContent: true
            }
          ).same
        ).toBe(true);
      });

      it('should build JS', function() {
        expect(
          dirCompare.compareSync(
            testCaseRoot + '/dist',
            testCaseRoot + '/expected-output',
            {
              includeFilter: '*.js',
              compareContent: false
            }
          ).same
        ).toBe(true);
      });
    });
  });
});
