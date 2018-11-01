#!/usr/bin/env node
const configure = require('../lib/configure');
const { setCwd } = require('../lib/cwd');

// npm scripts can have an incorrect cwd
// in this case INIT_CWD should be set
// see: https://docs.npmjs.com/cli/run-script
setCwd(process.env.INIT_CWD);

configure();
