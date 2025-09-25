import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export const makeFixturePathResolver = (dir: string = '') => {
  const appDir = path.dirname(require.resolve(path.join(process.cwd(), dir)));

  return (...paths: string[]) => path.join(appDir, ...paths);
};
