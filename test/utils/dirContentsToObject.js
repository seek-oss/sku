const { promisify } = require('util');
const readFilesAsync = promisify(require('node-dir').readFiles);
const { relative } = require('path');

module.exports = async (dirname, includeExtensions) => {
  const files = {};

  const handleFile = (err, content, filePath, next) => {
    if (err) {
      throw err;
    }

    const relativeFilePath = relative(dirname, filePath);

    if (
      !includeExtensions ||
      includeExtensions.filter(ext => relativeFilePath.endsWith(ext)).length > 0
    ) {
      files[relativeFilePath] = /\.js$/.test(relativeFilePath)
        ? 'CONTENTS IGNORED IN SNAPSHOT TEST'
        : content;
    }

    next();
  };

  await readFilesAsync(dirname, handleFile);

  return files;
};
