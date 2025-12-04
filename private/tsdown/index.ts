import type { UserConfig } from 'tsdown';

export const defaultConfig: UserConfig = {
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  exports: true,
};
