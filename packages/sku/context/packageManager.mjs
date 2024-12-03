// @ts-check
/** @type {string | undefined} */
let packageManager;

export const getPackageManager = () => {
  return packageManager;
};

/**
 * @param {string | undefined} pm
 */
export const setPackageManager = (pm) => {
  packageManager = pm;
};
