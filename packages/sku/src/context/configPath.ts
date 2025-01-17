let configPath: string | undefined;

export const getConfigPath = () => configPath;

export const setConfigPath = (path: string | undefined) => {
  configPath = path;
};
