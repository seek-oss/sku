const path = require('path');
const { paths, storybookAddons } = require('../../context');

module.exports = {
  stories: paths.src.map((srcPath) =>
    path.join(srcPath, '**/*.stories.@(js|ts|tsx)'),
  ),
  addons: storybookAddons,
};
