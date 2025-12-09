import { cwd } from '@sku-private/utils';
import { createRequire } from 'node:module';

export const resolvePolyfills = (polyfills: string[]): string[] => {
  const require = createRequire(import.meta.url);

  return polyfills.map((polyfill) =>
    require.resolve(polyfill, { paths: [cwd()] }),
  );
};
