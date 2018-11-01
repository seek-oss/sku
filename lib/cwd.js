let cwd = process.cwd();

const setCwd = newCwd => {
  if (newCwd) {
    cwd = newCwd;
  }
};

module.exports = {
  cwd,
  setCwd
};
