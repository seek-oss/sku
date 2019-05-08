const pkg = require('../package.json');
const Cache = require('async-disk-cache');
const inquirer = require('inquirer');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const runSkuScriptInDir = require('./utils/runSkuScriptInDir');
const readdirAsync = promisify(fs.readdir);

const cache = new Cache(pkg.name);
const LAST_TEST_CASE = 'lastTestCase';
const LAST_SCRIPT = 'lastScript';

const runScriptForTestCase = (script, testCase) => {
  const testCasePath = path.join(__dirname, 'test-cases', testCase);

  const hasAppDirectory = fs.existsSync(path.join(testCasePath, 'app'));

  return runSkuScriptInDir(
    script,
    path.join(testCasePath, hasAppDirectory ? 'app' : ''),
  );
};

(async () => {
  const { value: lastTestCase } = await cache.get(LAST_TEST_CASE);
  const { value: lastScript } = await cache.get(LAST_SCRIPT);

  if (lastTestCase && lastScript) {
    const { useLast } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useLast',
        message: `Re-run "${lastTestCase}" with "sku ${lastScript}"?`,
      },
    ]);

    if (useLast) {
      await runScriptForTestCase(lastScript, lastTestCase);
      return;
    }
  }

  const testCases = await readdirAsync(path.join(__dirname, 'test-cases'));

  const { testCase, script } = await inquirer.prompt([
    {
      type: 'list',
      name: 'testCase',
      message: 'Which case would you like to manually test?',
      choices: testCases,
    },
    {
      type: 'list',
      name: 'script',
      message: 'Which sku script would you like to run?',
      choices: [
        'start',
        'start-ssr',
        'build',
        'build-ssr',
        'storybook',
        'build-storybook',
        'configure',
      ],
    },
  ]);

  await cache.set(LAST_TEST_CASE, testCase);
  await cache.set(LAST_SCRIPT, script);

  await runScriptForTestCase(script, testCase);
})();
