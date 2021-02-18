const path = require('path');
const fs = require('fs-extra');
const rmfr = require('rmfr');

const { paths } = require('../context');

const cleanTargetDirectory = () => rmfr(`${paths.target}/*`);

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

  await rmfr(renderFileGlob);
};

module.exports = {
  cleanTargetDirectory,
  copyPublicFiles,
  ensureTargetDirectory,
  cleanRenderJs,
};
