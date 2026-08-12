import path from 'node:path';

export const createOutDir = (targetPath: string) => ({
  client: targetPath,
  ssrClient: path.join(targetPath, 'client'),
  ssr: path.join(targetPath, 'server'),
  ssg: path.join(targetPath, 'render'),
  join: (subPath: string) => path.join(targetPath, subPath),
});

export const renderEntryChunkName = 'render.js';
