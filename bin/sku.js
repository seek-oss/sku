#!/usr/bin/env node
const script = process.argv[2];

switch (script) {
  case 'init':
  case 'test':
  case 'test-ssr':
  case 'build':
  case 'build-ssr':
  case 'lint':
  case 'format':
  case 'start':
  case 'start-ssr': {
    const scriptPath = require.resolve('../scripts/' + script);
    require(scriptPath);
    break;
  }
  default: {
    console.log('Unknown script "' + script + '".');
    break;
  }
}
