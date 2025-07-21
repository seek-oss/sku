import path from 'node:path';

export const createOutDir = (targetPath: string) => ({
  client: targetPath,
  ssr: path.join(targetPath, 'server'),
  ssg: path.join(targetPath, 'render'),
});

export const renderEntryChunkName = 'render.js';
