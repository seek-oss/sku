#!/usr/bin/env node
const args = require('../config/args');

const { script, debug } = args;

if (debug) {
  // Enable all sku:* `debug` logs
  // @see https://www.npmjs.com/package/debug
  process.env.DEBUG = 'sku:*';
}

switch (script) {
  case 'init':
  case 'test':
  case 'test-ssr':
  case 'build':
  case 'build-ssr':
  case 'lint':
  case 'format':
  case 'start':
  case 'start-ssr':
  case 'storybook': {
    const scriptPath = require.resolve('../scripts/' + script);
    require(scriptPath);
    break;
  }
  default: {
    console.error(`Unknown script ${script}`);
    process.exit(1);
  }
}
