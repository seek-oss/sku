const path = require('path');
const fs = require('fs-extra');
const { promisify } = require('util');
const rimraf = promisify(require('rimraf'));

const { paths } = require('../context');

const cleanTargetDirectory = () => rimraf(`${paths.target}/*`);

const copyPublicFiles = () => {
  if (fs.existsSync(paths.public)) {
    console.log(`Copying ${paths.public} to ${paths.target}`);

    fs.copySync(paths.public, paths.target, {
      dereference: true
    });
  }
};

const ensureTargetDirectory = () => {
  fs.ensureDirSync(paths.target);
};

const cleanRenderJs = () => rimraf(path.join(paths.target, 'render.js'));

module.exports = {
  cleanTargetDirectory,
  copyPublicFiles,
  ensureTargetDirectory,
  cleanRenderJs
};
