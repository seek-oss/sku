export const MANAGED_BY_SKU_MARKER = '[sku_managed]';

type SingleValue = string | number | boolean;

interface SingleValueSetting {
  kind: 'value';
  value: SingleValue;
  comment?: string;
}

interface ObjectSetting {
  kind: 'object';
  entries: Readonly<Record<string, boolean>>;
}

interface ArraySetting {
  kind: 'array';
  entries: readonly string[];
}

type PnpmWorkspaceSetting = SingleValueSetting | ObjectSetting | ArraySetting;

/** Overwritten wholesale by `sku configure`: sku's value always wins. */
const singleValueSetting = (
  value: SingleValue,
  comment?: string,
): SingleValueSetting => ({ kind: 'value', value, comment });

/** A flat map merged per key. Marked keys are sku-owned, the rest are the user's. */
const objectSetting = (
  entries: Readonly<Record<string, boolean>>,
): ObjectSetting => ({ kind: 'object', entries });

/** Unioned and deduped. Marked entries are sku-owned, the rest are the user's. */
const arraySetting = (entries: readonly string[]): ArraySetting => ({
  kind: 'array',
  entries,
});

const minutesPerDay = 24 * 60;
const minimumReleaseAgeInDays = 3;

/**
 * Sku's recommended pnpm settings. Each entry declares its own value, merge
 * policy and comments, and everything the sync needs is derived from here.
 */
export const pnpmWorkspaceSettings = {
  allowBuilds: objectSetting({
    '@parcel/watcher': true,
    '@swc/core': true,
    'core-js-pure': false,
    esbuild: true,
    sku: true,
    'unrs-resolver': true,
  }),
  blockExoticSubdeps: singleValueSetting(true),
  minimumReleaseAge: singleValueSetting(
    minimumReleaseAgeInDays * minutesPerDay,
    `${minimumReleaseAgeInDays} days`,
  ),
  minimumReleaseAgeExclude: arraySetting([
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
  ]),
  publicHoistPattern: arraySetting(['eslint', 'prettier']),
  strictDepBuilds: singleValueSetting(false),
  trustPolicy: singleValueSetting('off'),
  trustPolicyExclude: arraySetting(['semver@6.3.1']),
} satisfies Record<string, PnpmWorkspaceSetting>;

type PnpmWorkspaceSettingKey = keyof typeof pnpmWorkspaceSettings;

type Keyed<TSetting> = TSetting & { key: PnpmWorkspaceSettingKey };

const keyedSettings: Array<Keyed<PnpmWorkspaceSetting>> = (
  Object.keys(pnpmWorkspaceSettings) as PnpmWorkspaceSettingKey[]
).map((key) => ({ key, ...pnpmWorkspaceSettings[key] }));

export const singleValueSettings = keyedSettings.filter(
  (setting): setting is Keyed<SingleValueSetting> => setting.kind === 'value',
);

export const objectSettings = keyedSettings.filter(
  (setting): setting is Keyed<ObjectSetting> => setting.kind === 'object',
);

export const arraySettings = keyedSettings.filter(
  (setting): setting is Keyed<ArraySetting> => setting.kind === 'array',
);

const settingValue = (setting: PnpmWorkspaceSetting) => {
  switch (setting.kind) {
    case 'value':
      return setting.value;
    case 'object':
      return { ...setting.entries };
    case 'array':
      return [...setting.entries];
  }
};

/** The settings as plain values, for scaffolding a `pnpm-workspace.yaml` from scratch. */
export const defaultPnpmWorkspaceConfig = Object.fromEntries(
  keyedSettings.map((setting) => [setting.key, settingValue(setting)]),
) as Record<PnpmWorkspaceSettingKey, ReturnType<typeof settingValue>>;
