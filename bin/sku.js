#!/usr/bin/env node
const debug = require('debug');
const args = require('../config/args');
const validatePeersDeps = require('../lib/validatePeersDeps');
const log = debug('sku:bin');

const { script } = args;

if (args.debug) {
  // Enable all sku:* `debug` logs
  // @see https://www.npmjs.com/package/debug
  process.env.DEBUG = `sku:*${`,${process.env.DEBUG}` || ''}`;
  debug.enable(process.env.DEBUG);
}

const configureProject = async () => {
  const configure = require('../lib/configure');
  await configure();
};

const runScript = (scriptName) => {
  require(`../scripts/${scriptName}`);
};

log(`Starting script: ${script}`);

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
    case 'pre-commit':
    case 'translations': {
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
    case 'serve': {
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
