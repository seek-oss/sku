import { describe, it, expect } from 'vitest';
import {
  MANAGED_BY_SKU_MARKER,
  MANAGED_BY_SKU_COMMENT,
  defaultPnpmWorkspaceConfig,
  defaultConfig,
  settingPolicies,
  singleValueSettings,
  objectSettings,
  arraySettings,
  explanatoryComments,
} from './pnpmWorkspaceDefaults.ts';

describe('pnpmWorkspaceDefaults', () => {
  it('exports marker constants', () => {
    expect(MANAGED_BY_SKU_MARKER).toBe('managed by sku');
    expect(MANAGED_BY_SKU_COMMENT).toBe('# managed by sku');
  });

  it('exports default config matching the pnpm-plugin recommended settings', () => {
    expect(defaultConfig).toBe(defaultPnpmWorkspaceConfig);
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

  it('classifies every setting with a valid policy', () => {
    const configKeys = Object.keys(defaultPnpmWorkspaceConfig).sort();
    const policyKeys = Object.keys(settingPolicies).sort();

    expect(policyKeys).toEqual(configKeys);

    for (const key of singleValueSettings) {
      expect(settingPolicies[key]).toBe('single-value');
      expect(['string', 'number', 'boolean']).toContain(
        typeof defaultPnpmWorkspaceConfig[key],
      );
    }

    for (const key of objectSettings) {
      expect(settingPolicies[key]).toBe('object');
      expect(typeof defaultPnpmWorkspaceConfig[key]).toBe('object');
      expect(Array.isArray(defaultPnpmWorkspaceConfig[key])).toBe(false);
    }

    for (const key of arraySettings) {
      expect(settingPolicies[key]).toBe('array');
      expect(Array.isArray(defaultPnpmWorkspaceConfig[key])).toBe(true);
    }
  });

  it('exports explanatory comments for specific settings', () => {
    expect(explanatoryComments.minimumReleaseAge).toBe('# 3 days');
    expect(explanatoryComments.trustPolicyExclude['semver@6.3.1']).toBe(
      '# dependency of eslint-plugin-react',
    );
  });
});
