let packageManager: string | undefined;

export const getPackageManager = () => packageManager;

export const setPackageManager = (pm: string | undefined) => {
  packageManager = pm;
};
