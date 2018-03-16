const glob = require('glob');

module.exports = cwd => {
  return glob.sync('*/', { cwd: cwd }).map(subDir => {
    return subDir.replace(/\/$/, '');
  });
};
