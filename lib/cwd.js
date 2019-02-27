const path = require('path');

let currentCwd = process.cwd();

// If you are setting cwd in your script
// it must be called first, including any requires.
// This issue will be resolved in a future release.
const setCwd = newCwd => {
  if (newCwd) {
    currentCwd = newCwd;
  }
};

const cwd = () => currentCwd;

const getPathFromCwd = filePath => path.join(currentCwd, filePath);

const requireFromCwd = modulePath =>
  require(require.resolve(modulePath, { paths: [cwd()] }));

module.exports = {
  cwd,
  setCwd,
  getPathFromCwd,
  requireFromCwd,
};
