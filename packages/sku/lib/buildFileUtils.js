const path = require('path');
const { copyFile, mkdir } = require('fs/promises');
const { rimraf } = require('rimraf');

const { paths } = require('../context');
const exists = require('./exists');

const cleanTargetDirectory = () => rimraf(`${paths.target}/*`, { glob: true });

const copyPublicFiles = async () => {
  if (await exists(paths.public)) {
    console.log(`Copying ${paths.public} to ${paths.target}`);

    await copyFile(paths.public, paths.target);
  }
};

const ensureTargetDirectory = async () => {
  await mkdir(paths.target, { recursive: true });
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
