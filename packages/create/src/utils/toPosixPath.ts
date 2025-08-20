export const toPosixPath = (filePath: string) => {
  return filePath.replace(/\\/g, '/');
};
