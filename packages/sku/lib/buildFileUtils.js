const path = require('path');
const fs = require('fs/promises');
const { rimraf } = require('rimraf');

const { paths } = require('../context');
const exists = require('./exists');

const cleanTargetDirectory = () => rimraf(`${paths.target}/*`, { glob: true });

const copyPublicFiles = async () => {
  if (await exists(paths.public)) {
    const files = await fs.readdir(paths.public);

    for (const file of files) {
      await fs.copyFile(
        path.join(paths.public, file),
        path.join(paths.target, file),
      );
    }
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
