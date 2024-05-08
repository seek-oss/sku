// @ts-check
const path = require('node:path');
const fs = require('node:fs/promises');
const { fdir: Fdir } = require('fdir');

const { paths } = require('../context');
const exists = require('./exists');
const copyDirContents = require('./copyDirContents');

const cleanTargetDirectory = async () => {
  fs.rm(paths.target, { recursive: true, force: true });
};

const copyPublicFiles = async () => {
  if (await exists(paths.public)) {
    await copyDirContents(path.join(paths.public), path.join(paths.target));
  }
};

const ensureTargetDirectory = async () => {
  await fs.mkdir(paths.target, { recursive: true });
};

const cleanStaticRenderEntry = async () => {
  const files = await new Fdir()
    .withBasePath()
    .filter((file) => file.endsWith('render.js'))
    .crawl(paths.target)
    .withPromise();

  for (const file of files) {
    await fs.rm(file);
  }
};

module.exports = {
  cleanTargetDirectory,
  copyPublicFiles,
  ensureTargetDirectory,
  cleanStaticRenderEntry,
};
