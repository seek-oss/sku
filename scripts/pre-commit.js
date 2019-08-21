#!/usr/bin/env node
const preCommit = require('../lib/preCommit');

(async () => {
  try {
    await preCommit();
  } catch (e) {
    process.exit(1);
  }
})();
