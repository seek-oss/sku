const cwd = process.cwd();
const path = require('path');
const fs = require('fs');
const skuConfigPath = path.join(cwd, 'sku.config.js');
const skuConfig = fs.existsSync(skuConfigPath) ? require(skuConfigPath) : {};

const entry = skuConfig.entry || {};
const clientEntry = path.join(cwd, entry.client || 'src/client.js');
const renderEntry = path.join(cwd, entry.render || 'src/render.js');

const public = path.join(cwd, skuConfig.public || 'public');
const dist = path.join(cwd, skuConfig.target || 'dist');

const seekStyleGuide = path.join(cwd, 'node_modules/seek-style-guide');

module.exports = {
  seekStyleGuide,
  clientEntry,
  renderEntry,
  public,
  dist
};
