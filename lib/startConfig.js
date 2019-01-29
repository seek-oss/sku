const fs = require('fs');
const path = require('path');

const startConfigPath = path.join(
  __dirname,
  '../entry/render/startConfig.json'
);

const writeStartConfig = (newConfig = {}) => {
  let currentConfig = {};

  if (fs.existsSync(startConfigPath)) {
    currentConfig = JSON.parse(fs.readFileSync(startConfigPath));
  }

  const config = {
    ...currentConfig,
    ...newConfig
  };

  fs.writeFileSync(startConfigPath, JSON.stringify(config, null, 2));
};

module.exports = {
  writeStartConfig
};
