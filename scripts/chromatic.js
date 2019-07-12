const ci = require('env-ci')();
const chalk = require('chalk');
const { runBin } = require('../lib/runBin');
const { storybookPort } = require('../context');
const skuPath = require.resolve('../bin/sku');

(async () => {
  // Handle Travis CI setup: http://docs.chromaticqa.com/setup_ci#travis
  if (ci.service === 'travis') {
    const {
      TRAVIS_EVENT_TYPE,
      TRAVIS_PULL_REQUEST_SLUG,
      TRAVIS_REPO_SLUG,
    } = process.env;

    const isInitialPrBuild = TRAVIS_EVENT_TYPE === 'pull_request';
    const isInternalPr = TRAVIS_PULL_REQUEST_SLUG === TRAVIS_REPO_SLUG;

    if (isInitialPrBuild && isInternalPr) {
      console.log('');
      console.log(
        'Skipping Chromatic for internal pull request build on Travis CI: http://docs.chromaticqa.com/setup_ci#travis',
      );
      console.log('');
      process.exit(0);
    }
  }

  try {
    await runBin({
      packageName: 'storybook-chromatic',
      binName: 'chromatic',
      options: { stdio: 'inherit' },
      args: [
        'test',

        '--storybook-port',
        storybookPort,

        // Tell Chromatic to execute sku directly, otherwise it
        // will run 'npm run storybook', which may not be
        // configured correctly in the consumer's package.json.
        '--exec',
        `NODE_ENV=production ${skuPath} storybook`,

        // Changes should be reviewed in the pull request via the GitHub
        // integration, rather than breaking the build.
        '--exit-zero-on-changes',

        // Since we tend to squash when merging to master, the squashed
        // commit technically hasn't been accepted in Chromatic.
        // This flag ensures that master builds are assumed to have
        // already been accepted during the PR process.
        ...(ci.branch === 'master' ? ['--auto-accept-changes'] : []),
      ],
    });

    console.log(chalk.cyan(`Chromatic complete`));
  } catch (exitCode) {
    console.error(
      chalk.red('Error: Chromatic exited with exit code', exitCode),
    );

    process.exit(1);
  }
})();
