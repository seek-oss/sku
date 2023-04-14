const path = require('path');
const fs = require('fs-extra');
const { rimraf } = require('rimraf');

const { paths } = require('../context');

const cleanTargetDirectory = () => rimraf(`${paths.target}/*`, { glob: true });

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
  const renderFileGlob = path.join(paths.target, '*render.js');
  await rimraf(renderFileGlob, { glob: true });
};

module.exports = {
  cleanTargetDirectory,
  copyPublicFiles,
  ensureTargetDirectory,
  cleanRenderJs,
};
