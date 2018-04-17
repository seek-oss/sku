const { promisify } = require('es6-promisify');
const readFilesAsync = promisify(require('node-dir').readFiles);
const { relative } = require('path');

module.exports = async dirname => {
  const files = {};

  const handleFile = (err, content, filePath, next) => {
    if (err) throw err;

    const relativeFilePath = relative(dirname, filePath);
    
    files[relativeFilePath] = /\.js$/.test(relativeFilePath)
      ? 'CONTENTS IGNORED IN SNAPSHOT TEST'
      : content;

    next();
  };
  
  await readFilesAsync(dirname, handleFile);

  return files;
};
