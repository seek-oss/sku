const prettierWrite = require('../lib/runPrettier').write;
const args = require('../config/args').argv;

const pathsToCheck = args.length === 0 ? [] : args;

prettierWrite(pathsToCheck);
