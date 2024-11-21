#!/usr/bin/env node
const preCommit = require('../lib/preCommit');

(async () => {
  try {
    await preCommit();
  } catch {
    process.exit(1);
  }
})();
