const path = require('path');

const { paths } = require('../context');
const fs = require('fs/promises');
const debug = require('debug');
const glob = require('fast-glob');

const log = debug('sku:storybook');

const previewFileName = 'preview.{js,ts,tsx}';

const previewFileAbsolutePath = path.join(
  path.dirname(paths.appSkuConfigPath),
  '.storybook',
  previewFileName,
);

/**
 * This function first cleans up any existing preview.{js,ts,tsx} files in the provided storybook config directory.
 * This includes any potentially dangling symlinks.
 * Then it looks for a `.storybook/preview.{js,ts,tsx}` file relative to the sku config folder.
 * If 1 file is found, a symlink is created to it from the provided storybook config directory.
 * Does nothing if 0 or >1 files are found.
 *
 * @param {string} storybookConfigDirectory The path to the storybook config directory
 * */
const setUpStorybookPreviewFile = async (storybookConfigDirectory) => {
  const symlinkFileAsbolutePath = path.join(
    storybookConfigDirectory,
    previewFileName,
  );
  const symlinkFiles = await glob(symlinkFileAsbolutePath, {
    dot: true,
    onlyFiles: false, // Required to find dangling symlinks
  });

  // Clean up any existing files in the storybook config folder so we have a clean slate
  for (const symlinkFile of symlinkFiles) {
    await fs.unlink(symlinkFile);
    log(`Cleaning up exising file ${symlinkFile}.`);
  }

  const previewFiles = await glob(previewFileAbsolutePath);

  if (previewFiles.length > 1) {
    console.log(
      'Multiple storybook preview files found. Please only define a single preview file.',
    );
    console.log(previewFiles);

    return;
  }

  const previewFile = previewFiles?.[0];

  if (previewFile) {
    const previewFileExtension = path.extname(previewFile);
    const symlinkFile = path.join(
      storybookConfigDirectory,
      `preview${previewFileExtension}`,
    );

    log(`Found preview file at ${previewFile}`);
    log(`Creating symlink from ${symlinkFile} to ${previewFile}`);

    await fs.symlink(previewFile, symlinkFile);
  }
};

module.exports = { setUpStorybookPreviewFile };
