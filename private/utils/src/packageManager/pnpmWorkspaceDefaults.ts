export const MANAGED_BY_SKU_MARKER = 'sku_managed';
export const MANAGED_BY_SKU_COMMENT = '# sku_managed';

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

type PnpmWorkspaceSettingKey = keyof PnpmWorkspaceConfig;

export const singleValueSettings = [
  'blockExoticSubdeps',
  'minimumReleaseAge',
  'strictDepBuilds',
  'trustPolicy',
] as const satisfies readonly PnpmWorkspaceSettingKey[];

export const objectSettings = [
  'allowBuilds',
] as const satisfies readonly PnpmWorkspaceSettingKey[];

export const arraySettings = [
  'minimumReleaseAgeExclude',
  'publicHoistPattern',
  'trustPolicyExclude',
] as const satisfies readonly PnpmWorkspaceSettingKey[];

export const explanatoryComments = {
  minimumReleaseAge: '# 3 days',
} as const satisfies Partial<Record<PnpmWorkspaceSettingKey, string>>;
