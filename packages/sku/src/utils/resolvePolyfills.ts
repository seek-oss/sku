import { cwd } from '@sku-private/utils';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export const resolvePolyfills = (polyfills: string[]): string[] =>
  polyfills.map((polyfill) => require.resolve(polyfill, { paths: [cwd()] }));
