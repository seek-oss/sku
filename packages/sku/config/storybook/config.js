const fs = require('fs');
const path = require('path');
const { paths, storybookAddons } = require('../../context');

module.exports = {
  stories: paths.src
    .filter((srcPath) => fs.statSync(srcPath).isDirectory())
    .map((srcPath) => path.join(srcPath, '**/*.stories.@(js|ts|tsx)')),
  addons: storybookAddons,
  core: {
    builder: 'webpack5',
  },
};
