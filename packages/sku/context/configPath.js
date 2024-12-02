// @ts-check
/** @type {string | undefined} */
let configPath;

const getConfigPath = () => {
  return configPath;
};

/**
 * @param {string | undefined} path
 */
const setConfigPath = (path) => {
  configPath = path;
};

module.exports = {
  getConfigPath,
  setConfigPath,
};
