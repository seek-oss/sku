const path = require('path');
const fs = require('fs-extra');
const { promisify } = require('util');
const rimraf = promisify(require('rimraf'));
const glob = require('fast-glob');

const { paths } = require('../context');

const cleanTargetDirectory = () => rimraf(`${paths.target}/*`);

const copyPublicFiles = () => {
  if (fs.existsSync(paths.public)) {
    console.log(`Copying ${paths.public} to ${paths.target}`);

    fs.copySync(paths.public, paths.target, {
      dereference: true,
    });
  }
};

const ensureTargetDirectory = () => {
  fs.ensureDirSync(paths.target);
};

const cleanRenderJs = async () => {
  const renderFiles = await glob(path.join(paths.target, '*render.js'));

  for (const file of renderFiles) {
    await rimraf(file);
  }
};

module.exports = {
  cleanTargetDirectory,
  copyPublicFiles,
  ensureTargetDirectory,
  cleanRenderJs,
};
