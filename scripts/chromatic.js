const ci = require('ci-env');
const gracefulSpawn = require('../lib/gracefulSpawn');
const builds = require('../config/builds');
const { storybookPort } = builds[0];
const chromaticPath = require.resolve(
  'storybook-chromatic/dist/bin/chromatic.js'
);
const skuPath = require.resolve('../bin/sku');

// Handle Travis CI setup: http://docs.chromaticqa.com/setup_ci#travis
if (process.env.TRAVIS) {
  const {
    TRAVIS_EVENT_TYPE,
    TRAVIS_PULL_REQUEST_SLUG,
    TRAVIS_REPO_SLUG
  } = process.env;

  const isInitialPrBuild = TRAVIS_EVENT_TYPE === 'pull_request';
  const isInternalPr = TRAVIS_PULL_REQUEST_SLUG === TRAVIS_REPO_SLUG;

  if (isInitialPrBuild && isInternalPr) {
    console.log('');
    console.log(
      'Skipping Chromatic for initial pull request build on Travis CI: http://docs.chromaticqa.com/setup_ci#travis'
    );
    console.log(
      'You should disable "Build on Pull Requests" in your repository settings: https://docs.travis-ci.com/user/pull-requests/#how-pull-requests-are-built'
    );
    console.log('');
    process.exit(0);
  }
}

const chromaticProcess = gracefulSpawn(
  chromaticPath,
  [
    'test',

    '--storybook-port',
    storybookPort,

    // Tell Chromatic to execute sku directly, otherwise it
    // will run 'npm run storybook', which may not be
    // configured correctly in the consumer's package.json.
    '--exec',
    `${skuPath} storybook`,

    // Changes should be reviewed in the pull request via the GitHub
    // integration, rather than breaking the build.
    '--exit-zero-on-changes',

    // Since we tend to squash when merging to master, the squashed
    // commit technically hasn't been accepted in Chromatic.
    // This flag ensures that master builds are assumed to have
    // already been accepted during the PR process.
    ...(ci.branch === 'master' ? ['--auto-accept-changes'] : [])
  ],
  { stdio: 'inherit' }
);

chromaticProcess.on('exit', exitCode => {
  process.exit(exitCode);
});
