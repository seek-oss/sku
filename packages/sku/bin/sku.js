#!/usr/bin/env node
const fs = require('fs');
const debug = require('debug');
const args = require('../config/args');
const _validatePeerDeps = require('../lib/validatePeerDeps');
const { getPathFromCwd } = require('../lib/cwd');
const log = debug('sku:bin');

const { script } = args;

if (args.debug) {
  // Enable all sku:* `debug` logs
  // @see https://www.npmjs.com/package/debug
  process.env.DEBUG = `sku:*${`,${process.env.DEBUG}` || ''}`;
  debug.enable(process.env.DEBUG);
}

let skipConfigure = false;
let skipValidatePeerDeps = false;
const packageJson = getPathFromCwd('./package.json');
const packageJsonExists = fs.existsSync(packageJson);

if (packageJsonExists) {
  const {
    skuSkipConfigure = false,
    skuSkipValidatePeerDeps = false,
  } = require(packageJson);
  skipConfigure = skuSkipConfigure;
  skipValidatePeerDeps = skuSkipValidatePeerDeps;
}

const configureProject = async () => {
  if (skipConfigure) {
    log(`"skuSkipConfigure" set in ${packageJson}, skipping sku configuration`);
    return;
  }

  const configure = require('../lib/configure');
  await configure();
};

const validatePeerDeps = () => {
  if (skipValidatePeerDeps) {
    log(
      `"skuSkipValidatePeerDeps" set in ${packageJson}, skipping sku peer dependency validation`,
    );
    return;
  }

  // Intentionally not awaiting async function as it's just for logging warnings
  _validatePeerDeps();
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
    case 'storybook':
    case 'build-storybook':
    case 'build':
    case 'build-ssr':
    case 'serve': {
      await configureProject();

      validatePeerDeps();
      runScript(script);
      break;
    }

    default: {
      console.error(`Unknown script ${script}`);
      process.exit(1);
    }
  }
})();
