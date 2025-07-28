import { createRequire } from 'node:module';
import { cwd } from './cwd.js';

export const resolvePolyfills = (polyfills: string[]): string[] => {
  const require = createRequire(import.meta.url);

  return polyfills.map((polyfill) =>
    require.resolve(polyfill, { paths: [cwd()] }),
  );
};
