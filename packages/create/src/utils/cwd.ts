let cwd = process.cwd();

export const setCwd = (dir: string) => {
  cwd = dir;
};

export const getCwd = () => cwd;
