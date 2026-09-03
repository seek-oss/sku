export const MANAGED_BY_SKU_MARKER = 'managed by sku';
export const MANAGED_BY_SKU_COMMENT = '# managed by sku';

export const defaultPnpmWorkspaceConfig = {
  allowBuilds: {
    '@parcel/watcher': true,
    '@swc/core': true,
    'core-js-pure': false,
    esbuild: true,
    sku: true,
    'unrs-resolver': true,
  },
  blockExoticSubdeps: true,
  minimumReleaseAge: 4320,
  minimumReleaseAgeExclude: [
    '@braid-design-system/*',
    '@capsizecss/*',
    '@seek/*',
    '@sku-lib/*',
    '@vanilla-extract/*',
    '@vocab/*',
    'braid-design-system',
    'browserslist-config-seek',
    'eslint-config-seek',
    'sku',
  ],
  publicHoistPattern: ['eslint', 'prettier'],
  strictDepBuilds: false,
  trustPolicy: 'off',
  trustPolicyExclude: ['semver@6.3.1'],
} as const;

export const defaultConfig = defaultPnpmWorkspaceConfig;

export type PnpmWorkspaceConfig = typeof defaultPnpmWorkspaceConfig;

export type SettingPolicy = 'single-value' | 'object' | 'array';

export const settingPolicies: Record<keyof PnpmWorkspaceConfig, SettingPolicy> =
  {
    allowBuilds: 'object',
    blockExoticSubdeps: 'single-value',
    minimumReleaseAge: 'single-value',
    minimumReleaseAgeExclude: 'array',
    publicHoistPattern: 'array',
    strictDepBuilds: 'single-value',
    trustPolicy: 'single-value',
    trustPolicyExclude: 'array',
  };

export const singleValueSettings = [
  'blockExoticSubdeps',
  'minimumReleaseAge',
  'strictDepBuilds',
  'trustPolicy',
] as const;

export const objectSettings = ['allowBuilds'] as const;

export const arraySettings = [
  'minimumReleaseAgeExclude',
  'publicHoistPattern',
  'trustPolicyExclude',
] as const;

export const explanatoryComments = {
  minimumReleaseAge: '# 3 days',
  trustPolicyExclude: {
    'semver@6.3.1': '# dependency of eslint-plugin-react',
  },
} as const;
