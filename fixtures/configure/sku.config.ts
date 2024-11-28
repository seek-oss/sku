import type { SkuConfig } from 'sku';

export default {
  target: 'foo/bar',
  dangerouslySetESLintConfig: (config) => {
    const custom = {
      rules: {
        'no-console': 'off',
      },
    } as const;

    return [...config, custom];
  },
} satisfies SkuConfig;
