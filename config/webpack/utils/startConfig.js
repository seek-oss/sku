const fs = require('fs');
const path = require('path');

const startConfigPath = path.join(__dirname, '../../render/startConfig.json');

const writeStartConfig = (environment, site) => {
  fs.writeFileSync(
    startConfigPath,
    JSON.stringify(
      {
        environment,
        site
      },
      null,
      2
    )
  );
};

module.exports = {
  writeStartConfig
};
