export const MANAGED_BY_SKU_MARKER = 'sku_managed';
export const MANAGED_BY_SKU_COMMENT = `# ${MANAGED_BY_SKU_MARKER}`;

type SingleValue = string | number | boolean;

/** An entry in an array setting, with its explanatory comment if it has one. */
export interface ArrayEntry {
  value: string;
  comment?: string;
}

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
  entries: readonly ArrayEntry[];
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
const arraySetting = (
  entries: ReadonlyArray<string | ArrayEntry>,
): ArraySetting => ({
  kind: 'array',
  entries: entries.map((entry) =>
    typeof entry === 'string' ? { value: entry } : entry,
  ),
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
  trustPolicyExclude: arraySetting([
    { value: 'semver@6.3.1', comment: 'dependency of eslint-plugin-react' },
  ]),
} satisfies Record<string, PnpmWorkspaceSetting>;

export type PnpmWorkspaceSettingKey = keyof typeof pnpmWorkspaceSettings;

type Keyed<TSetting> = TSetting & { key: PnpmWorkspaceSettingKey };

const settingKeys = Object.keys(
  pnpmWorkspaceSettings,
) as PnpmWorkspaceSettingKey[];

const keyedSettings: Array<Keyed<PnpmWorkspaceSetting>> = settingKeys.map(
  (key) => ({ key, ...pnpmWorkspaceSettings[key] }),
);

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
      return setting.entries.map(({ value }) => value);
  }
};

export type PnpmWorkspaceConfig = Record<
  PnpmWorkspaceSettingKey,
  ReturnType<typeof settingValue>
>;

/** The settings as plain values, for scaffolding a `pnpm-workspace.yaml` from scratch. */
export const defaultPnpmWorkspaceConfig = Object.fromEntries(
  keyedSettings.map((setting) => [setting.key, settingValue(setting)]),
) as PnpmWorkspaceConfig;
