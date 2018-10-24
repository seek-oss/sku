#!/usr/bin/env node
const path = require('path');
const ensureGitignore = require('ensure-gitignore');
const uniq = require('lodash/uniq');
const builds = require('../config/builds');

const outputDirs = uniq(
  builds.map(
    ({ paths }) =>
      `${paths.dist.replace(`${process.cwd()}${path.sep}`, '')}${path.sep}`
  )
);

ensureGitignore({
  comment: 'managed by sku',
  patterns: [...outputDirs, `report${path.sep}`]
});
