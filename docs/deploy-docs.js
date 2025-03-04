const ghpages = require('gh-pages');

const repoUrl = require('../package.json').repository.url;

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const tokenRegex = GITHUB_TOKEN ? new RegExp(GITHUB_TOKEN, 'g') : null;

const log = function (message) {
  console.log(
    tokenRegex ? message.replace(tokenRegex, '[GITHUB_TOKEN]') : message,
  );
};

const makeConfig = function () {
  return {
    repo: GITHUB_TOKEN
      ? repoUrl.replace('https://', `https://${GITHUB_TOKEN}@`)
      : repoUrl,
    logger: log,
    dotfiles: true,
  };
};

ghpages.publish('.', makeConfig(), function (err) {
  if (err) {
    log('Deployment error');
    log(JSON.stringify(err));
    process.exit(1);
  } else {
    log('Deployment complete!');
  }
});
