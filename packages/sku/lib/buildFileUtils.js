// @ts-check
const path = require('node:path');
const fs = require('node:fs/promises');
const { rimraf } = require('rimraf');

const { paths } = require('../context');
const exists = require('./exists');
const copyDirContents = require('./copyDirContents');

const cleanTargetDirectory = () => rimraf(`${paths.target}/*`, { glob: true });

const copyPublicFiles = async () => {
  if (await exists(paths.public)) {
    await copyDirContents(path.join(paths.public), path.join(paths.target));
  }
};

const ensureTargetDirectory = async () => {
  await fs.mkdir(paths.target, { recursive: true });
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
