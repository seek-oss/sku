#!/usr/bin/env node
const configure = require('../lib/configure');

// npm scripts can have an incorrect cwd
// in this case INIT_CWD should be set
// see: https://docs.npmjs.com/cli/run-script
configure(process.env.INIT_CWD);
