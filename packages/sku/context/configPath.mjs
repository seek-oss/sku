// @ts-check
/** @type {string | undefined} */
let configPath;

export const getConfigPath = () => {
  return configPath;
};

/**
 * @param {string | undefined} path
 */
export const setConfigPath = (path) => {
  configPath = path;
};
