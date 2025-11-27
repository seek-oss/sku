import type { UserConfig } from 'tsdown';

export const defaultConfig: UserConfig = {
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  exports: true,
  sourcemap: true,
};
