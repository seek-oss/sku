import { join, relative } from 'node:path';
import { rm, mkdir } from 'node:fs/promises';
import { fdir as Fdir } from 'fdir';

import exists from './exists.js';
import { copyDirContents } from './copyDirContents.js';
import type { SkuContext } from '../context/createSkuContext.js';
import { cwd } from '@sku-private/utils';

export const cleanTargetDirectory = async (
  target: string,
  includeDirectory: boolean = false,
) => {
  const files = await new Fdir()
    .withBasePath()
    .withMaxDepth(1)
    .withDirs()
    // This glob pattern is used to exclude the target directory itself
    .glob(includeDirectory ? '**/*' : `${target}/*`)
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
  if (!(await exists(paths.public))) {
    return;
  }

  const currentCwd = cwd();
  console.log(
    `Copying public assets from "${relative(currentCwd, paths.public)}" to "${relative(currentCwd, paths.target)}"`,
  );

  await copyDirContents(join(paths.public), join(paths.target));
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
