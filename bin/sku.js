#!/usr/bin/env node
const args = require('../config/args');

const { script, debug } = args;

if (debug) {
  // Enable all sku:* `debug` logs
  // @see https://www.npmjs.com/package/debug
  process.env.DEBUG = 'sku:*';
}

const runScript = scriptName => {
  require(`../scripts/${scriptName}`);
};

switch (script) {
  case 'setup-hosts':
  case 'init':
  case 'configure': {
    runScript(script);
    break;
  }

  case 'test':
  case 'test-ssr':
  case 'build':
  case 'build-ssr':
  case 'lint':
  case 'format':
  case 'start':
  case 'start-ssr':
  case 'storybook':
  case 'build-storybook':
  case 'playroom':
  case 'build-playroom':
  case 'chromatic': {
    runScript('configure');
    runScript(script);
    break;
  }
  default: {
    console.error(`Unknown script ${script}`);
    process.exit(1);
  }
}
