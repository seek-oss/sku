import { publish } from 'gh-pages';

import packageJson from '../package.json' with { type: 'json' };

const {
  repository: { url: repoUrl },
} = packageJson;

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const tokenRegex = GITHUB_TOKEN ? new RegExp(GITHUB_TOKEN, 'g') : null;

const log = function (message) {
  console.log(
    tokenRegex ? message.replace(tokenRegex, '[GITHUB_TOKEN]') : message,
  );
};

const publishConfig = {
  repo: GITHUB_TOKEN
    ? repoUrl.replace('git+https://', `https://${GITHUB_TOKEN}@`)
    : repoUrl,
  logger: log,
  dotfiles: true,
};

await publish('.', publishConfig, function (err) {
  if (err) {
    log('Deployment error');
    log(JSON.stringify(err));
    process.exit(1);
  } else {
    log('Deployment complete!');
  }
});
