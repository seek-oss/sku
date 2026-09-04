import { describe, it, expect } from 'vitest';
import {
  MANAGED_BY_SKU_MARKER,
  MANAGED_BY_SKU_COMMENT,
  defaultPnpmWorkspaceConfig,
  pnpmWorkspaceSettings,
  singleValueSettings,
  objectSettings,
  arraySettings,
} from './pnpmWorkspaceDefaults.ts';

describe('pnpmWorkspaceDefaults', () => {
  it('exports marker constants', () => {
    expect(MANAGED_BY_SKU_MARKER).toBe('sku_managed');
    expect(MANAGED_BY_SKU_COMMENT).toBe('# sku_managed');
  });

  it('exports default config matching the pnpm-plugin recommended settings', () => {
    expect(defaultPnpmWorkspaceConfig).toMatchInlineSnapshot(`
      {
        "allowBuilds": {
          "@parcel/watcher": true,
          "@swc/core": true,
          "core-js-pure": false,
          "esbuild": true,
          "sku": true,
          "unrs-resolver": true,
        },
        "blockExoticSubdeps": true,
        "minimumReleaseAge": 4320,
        "minimumReleaseAgeExclude": [
          "@braid-design-system/*",
          "@capsizecss/*",
          "@seek/*",
          "@sku-lib/*",
          "@vanilla-extract/*",
          "@vocab/*",
          "braid-design-system",
          "browserslist-config-seek",
          "eslint-config-seek",
          "sku",
        ],
        "publicHoistPattern": [
          "eslint",
          "prettier",
        ],
        "strictDepBuilds": false,
        "trustPolicy": "off",
        "trustPolicyExclude": [
          "semver@6.3.1",
        ],
      }
    `);
  });

  it('classifies every setting exactly once', () => {
    const classifiedKeys = [
      ...singleValueSettings,
      ...objectSettings,
      ...arraySettings,
    ]
      .map(({ key }) => key)
      .sort();

    expect(new Set(classifiedKeys).size).toBe(classifiedKeys.length);
    expect(classifiedKeys).toEqual(Object.keys(pnpmWorkspaceSettings).sort());
  });

  it('derives plain values from each setting group', () => {
    for (const { key, value } of singleValueSettings) {
      expect(defaultPnpmWorkspaceConfig[key]).toBe(value);
      expect(['string', 'number', 'boolean']).toContain(typeof value);
    }

    for (const { key, entries } of objectSettings) {
      expect(defaultPnpmWorkspaceConfig[key]).toEqual(entries);
    }

    for (const { key, entries } of arraySettings) {
      expect(defaultPnpmWorkspaceConfig[key]).toEqual(
        entries.map(({ value }) => value),
      );
    }
  });

  it('keeps explanatory comments alongside the values they describe', () => {
    expect(pnpmWorkspaceSettings.minimumReleaseAge).toEqual({
      kind: 'value',
      value: 4320,
      comment: '3 days',
    });

    expect(pnpmWorkspaceSettings.trustPolicyExclude.entries).toContainEqual({
      value: 'semver@6.3.1',
      comment: 'dependency of eslint-plugin-react',
    });
  });
});
