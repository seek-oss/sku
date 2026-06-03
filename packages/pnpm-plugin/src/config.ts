import type { Config } from '@pnpm/config';

export const defaultConfig = {
  allowBuilds: {
    '@swc/core': true,
    'core-js-pure': false,
    esbuild: true,
    sku: true,
    'unrs-resolver': true,
  },
  blockExoticSubdeps: true,
  ignorePatchFailures: false,
  minimumReleaseAge: 4320,
  minimumReleaseAgeExclude: [
    '@braid-design-system/*',
    '@seek/*',
    '@sku-lib/*',
    'braid-design-system',
    'browserslist-config-seek',
    'eslint-config-seek',
    'sku',
  ],
  packageManagerStrictVersion: true,
  publicHoistPattern: ['eslint', 'prettier'],
  strictDepBuilds: false,
  trustPolicy: 'off',
  trustPolicyExclude: ['semver@6.3.1'],
} satisfies Partial<Config>;
// `satisfies` ensures types are correct while still emitting a narrow type with no reference to
// `@pnpm/config`
