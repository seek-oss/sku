#!/usr/bin/env node
const path = require('path');
const ensureGitignore = require('ensure-gitignore');
const uniq = require('lodash/uniq');

const isTypeScript = require('../config/isTypeScript');
const builds = require('../config/builds');
const {
  bundleReportFolder
} = require('../config/webpack/plugins/bundleAnalyzer');

const addSep = p => `${p}${path.sep}`;

const gitIgnorePatterns = [addSep(bundleReportFolder)];

// Add target directories
gitIgnorePatterns.concat(
  uniq(
    builds.map(({ paths }) =>
      addSep(paths.dist.replace(addSep(process.cwd()), ''))
    )
  )
);

if (isTypeScript) {
  const tsConfigFileName = 'tsconfig.json';

  const tsConfig = {
    extends: require.resolve('../config/typescript/tsconfig.json'),
    include: builds.reduce((acc, { paths }) => [...acc, ...paths.src], []),
    exclude: [path.join(process.cwd(), 'node_modules')]
  };
  const outPath = path.join(process.cwd(), tsConfigFileName);

  fs.writeFileSync(outPath, JSON.stringify(tsConfig));
  gitIgnorePatterns.push(tsConfigFileName);
}

ensureGitignore({
  comment: 'managed by sku',
  patterns: gitIgnorePatterns
});
