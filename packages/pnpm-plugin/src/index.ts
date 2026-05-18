import { defaultConfig } from './config.ts';

// Based off `pnpm-plugin-skuba`
// https://github.com/seek-oss/skuba/blob/c22976f28d15bc26cb64b9a5b6b7dd17fa55c0a8/packages/pnpm-plugin-skuba/pnpmfile.cjs#L58
export default {
  hooks: {
    updateConfig(config: object) {
      Object.entries(defaultConfig).forEach(([key, value]) => {
        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean'
        ) {
          // @ts-expect-error
          config[key] ??= value;

          return;
        }

        if (Array.isArray(value)) {
          // @ts-expect-error
          config[key] ??= [];
          // @ts-expect-error
          config[key].push(...value);

          return;
        }

        if (typeof value === 'object' && value !== null) {
          // @ts-expect-error
          config[key] ??= {};
          // @ts-expect-error
          Object.assign(config[key], value);

          return;
        }
      });

      return config;
    },
  },
};
