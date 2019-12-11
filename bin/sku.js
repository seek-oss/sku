#!/usr/bin/env node
const args = require('../config/args');
const validatePeersDeps = require('../lib/validatePeersDeps');

const { script, debug } = args;

if (debug) {
  // Enable all sku:* `debug` logs
  // @see https://www.npmjs.com/package/debug
  process.env.DEBUG = 'sku:*';
}

const configureProject = async () => {
  const configure = require('../lib/configure');
  await configure();
};

const runScript = scriptName => {
  require(`../scripts/${scriptName}`);
};

(async () => {
  switch (script) {
    case 'setup-hosts':
    case 'init':
    case 'configure': {
      runScript(script);
      break;
    }

    case 'test':
    case 'test-ssr':
    case 'lint':
    case 'format':
    case 'pre-commit': {
      await configureProject();
      runScript(script);
      break;
    }

    case 'start':
    case 'start-ssr':
    case 'playroom':
    case 'storybook':
    case 'build-playroom':
    case 'build-storybook':
    case 'build':
    case 'build-ssr':
    case 'chromatic': {
      await configureProject();

      // Intentionally not awaiting async function as it's just for logging warnings
      validatePeersDeps();
      runScript(script);
      break;
    }

    default: {
      console.error(`Unknown script ${script}`);
      process.exit(1);
    }
  }
})();
