import { join } from 'node:path';
import { rm, mkdir } from 'node:fs/promises';
import { fdir as Fdir } from 'fdir';

import exists from './exists.js';
import copyDirContents from './copyDirContents.js';
import type { SkuContext } from '@/context/createSkuContext.js';

export const cleanTargetDirectory = async (target: string) => {
  const files = await new Fdir()
    .withBasePath()
    .withMaxDepth(1)
    .withDirs()
    // This glob pattern is used to exclude the target directory itself
    .glob(`${target}/*`)
    .crawl(target)
    .withPromise();

  for (const file of files) {
    await rm(file, { recursive: true, force: true });
  }
};

export const copyPublicFiles = async ({
  paths,
}: {
  paths: SkuContext['paths'];
}) => {
  if (await exists(paths.public)) {
    await copyDirContents(join(paths.public), join(paths.target));
  }
};

export const ensureTargetDirectory = async (target: string) => {
  await mkdir(target, { recursive: true });
};

export const cleanStaticRenderEntry = async ({
  paths,
}: {
  paths: SkuContext['paths'];
}) => {
  const files = await new Fdir()
    .withBasePath()
    .filter((file) => file.endsWith('render.js'))
    .crawl(paths.target)
    .withPromise();

  for (const file of files) {
    await rm(file);
  }
};
