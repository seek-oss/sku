const fs = require('fs');

const { paths } = require('../context');

module.exports = () => {
  if (fs.existsSync(paths.public)) {
    console.log(`Copying ${paths.public} to ${paths.target}`);

    fs.copySync(paths.public, paths.target, {
      dereference: true
    });
  }
};
