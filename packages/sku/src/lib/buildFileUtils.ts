import { join } from 'node:path';
import { rm, mkdir } from 'node:fs/promises';
import { fdir as Fdir } from 'fdir';

import { paths } from '../context/index.js';
import exists from './exists.js';
import copyDirContents from './copyDirContents.js';

export const cleanTargetDirectory = async () => {
  const files = await new Fdir()
    .withBasePath()
    .withMaxDepth(1)
    .withDirs()
    // This glob pattern is used to exclude the target directory itself
    .glob(`${paths.target}/*`)
    .crawl(paths.target)
    .withPromise();

  for (const file of files) {
    await rm(file, { recursive: true, force: true });
  }
};

export const copyPublicFiles = async () => {
  if (await exists(paths.public)) {
    await copyDirContents(join(paths.public), join(paths.target));
  }
};

export const ensureTargetDirectory = async () => {
  await mkdir(paths.target, { recursive: true });
};

export const cleanStaticRenderEntry = async () => {
  const files = await new Fdir()
    .withBasePath()
    .filter((file) => file.endsWith('render.js'))
    .crawl(paths.target)
    .withPromise();

  for (const file of files) {
    await rm(file);
  }
};
