// @ts-check
/** @type {string | undefined} */
let packageManager;

const getPackageManager = () => {
  return packageManager;
};

/**
 * @param {string | undefined} pm
 */
const setPackageManager = (pm) => {
  packageManager = pm;
};

module.exports = {
  getPackageManager,
  setPackageManager,
};
