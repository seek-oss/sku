let cwd = process.cwd();

// If you are setting cwd in your script
// it must be called first, including any requires.
// This issue will be resolved in a future release.
const setCwd = newCwd => {
  if (newCwd) {
    cwd = newCwd;
  }
};

module.exports = {
  cwd,
  setCwd
};
