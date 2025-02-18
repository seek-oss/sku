import { fdir as Fdir } from 'fdir';
import { rm } from 'node:fs/promises';

export const cleanupSsgBuild = async () => {
  const crawler = new Fdir();

  const files = await crawler
    .withBasePath()
    .withDirs()
    .glob('**/render/**', '**/.vite/**')
    .crawl(`${process.cwd()}/dist`)
    .withPromise();

  for (const file of files) {
    await rm(file, { recursive: true, force: true });
  }
};
