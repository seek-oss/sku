#!/usr/bin/env node
const spawn = require('cross-spawn');
const script = process.argv[2];
const args = process.argv.slice(3);

switch (script) {
  case 'test':
  case 'build':
  case 'lint':
  case 'format':
  case 'start': {
    const scriptPath = require.resolve('../scripts/' + script);
    const scriptArgs = [scriptPath, ...args];

    const result = spawn.sync('node', scriptArgs, { stdio: 'inherit' });
    process.exit(result.status);
    break;
  }
  default: {
    console.log('Unknown script "' + script + '".');
    break;
  }
}
