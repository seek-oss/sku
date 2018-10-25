#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const ensureGitignore = require('ensure-gitignore');
const uniq = require('lodash/uniq');

const writeFileAsync = promisify(fs.writeFile);

const isTypeScript = require('../config/isTypeScript');
const builds = require('../config/builds');
const {
  bundleReportFolder
} = require('../config/webpack/plugins/bundleAnalyzer');
const tslintConfig = require('../config/typescript/tslint.json');

const addSep = p => `${p}${path.sep}`;

const writeFileToCWD = async (fileName, content) => {
  const outPath = path.join(process.cwd(), fileName);

  await writeFileAsync(outPath, JSON.stringify(content));
};

(async () => {
  const gitIgnorePatterns = [addSep(bundleReportFolder)];

  // Add target directories
  gitIgnorePatterns.push(
    ...uniq(
      builds.map(({ paths }) =>
        addSep(paths.dist.replace(addSep(process.cwd()), ''))
      )
    )
  );

  if (isTypeScript) {
    const tsConfigFileName = 'tsconfig.json';
    const tslintConfigFileName = 'tslint.json';

    const tsConfig = {
      extends: require.resolve('../config/typescript/tsconfig.json'),
      include: builds.reduce((acc, { paths }) => [...acc, ...paths.src], []),
      exclude: [path.join(process.cwd(), 'node_modules')]
    };

    await writeFileToCWD(tsConfigFileName, tsConfig);
    await writeFileToCWD(tslintConfigFileName, tslintConfig);

    gitIgnorePatterns.push(tsConfigFileName, tslintConfigFileName);
  }

  await ensureGitignore({
    comment: 'managed by sku',
    patterns: gitIgnorePatterns
  });
})();
