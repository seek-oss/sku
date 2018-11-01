let currentCwd = process.cwd();

const setCwd = newCwd => {
  if (newCwd) {
    currentCwd = newCwd;
  }
};

const cwd = () => currentCwd;

module.exports = {
  cwd,
  setCwd
};
