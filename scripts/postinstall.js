#!/usr/bin/env node
const { setCwd } = require('../lib/cwd');

// npm scripts can have an incorrect cwd
// in this case INIT_CWD should be set
// see: https://docs.npmjs.com/cli/run-script
// must be run first
setCwd(process.env.INIT_CWD);

const configure = require('../lib/configure');

configure();
