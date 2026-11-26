import { createRequire } from 'node:module';
import type { PluginItem } from '@babel/core';

const require = createRequire(import.meta.url);

type BabelConfigOptions = {
  target: 'node' | 'browser';
  lang?: 'js' | 'ts';
  browserslist?: string | string[] | Record<string, string>;
  displayNamesProd?: boolean;
  removeAssertionsInProduction?: boolean;
  hot?: boolean;
};

type SkuBabelConfig = {
  babelrc: boolean;
  sourceType: 'unambiguous' | 'module';
  cacheDirectory?: boolean;
  cacheCompression?: boolean;
  presets: PluginItem[];
  plugins: PluginItem[];
};

export default ({
  target,
  lang = 'js',
  browserslist,
  displayNamesProd = false,
  removeAssertionsInProduction = true,
  hot = false,
}: BabelConfigOptions): SkuBabelConfig => {
  const isBrowser = target === 'browser';
  const isProductionBuild = process.env.NODE_ENV === 'production';

  const plugins: PluginItem[] = [
    require.resolve('babel-plugin-macros'),
    require.resolve('@babel/plugin-transform-runtime'),
  ];

  if (hot && isBrowser) {
    plugins.push([
      require.resolve('react-refresh/babel'),
      { skipEnvCheck: true },
    ]);
  }

  plugins.push(require.resolve('@loadable/babel-plugin'));

  if (isProductionBuild) {
    plugins.push(
      require.resolve('babel-plugin-transform-react-remove-prop-types'),
      require.resolve('@babel/plugin-transform-react-constant-elements'),
    );

    if (displayNamesProd) {
      plugins.push(require.resolve('@sku-lib/babel-plugin-display-name'));
    }

    if (removeAssertionsInProduction) {
      plugins.push([
        require.resolve('babel-plugin-unassert'),
        {
          variables: ['assert', 'invariant'],
          modules: ['assert', 'node:assert', 'tiny-invariant', 'outvariant'],
        },
      ]);
    }
  }

  const presets = [
    [
      require.resolve('@babel/preset-env'),
      {
        targets: browserslist,
        shippedProposals: true,
      },
    ],
    lang === 'ts'
      ? [
          require.resolve('@babel/preset-typescript'),
          {
            isTSX: true,
            allExtensions: true,
            // babel equivalent of tsconfig `verbatimModuleSyntax: true`
            onlyRemoveTypeImports: true,
          },
        ]
      : null,
    [
      require.resolve('@babel/preset-react'),
      {
        runtime: 'automatic',
        development: !isProductionBuild,
      },
    ],
  ].filter((preset): preset is NonNullable<typeof preset> => Boolean(preset));

  return {
    babelrc: false,
    sourceType: isBrowser ? 'unambiguous' : 'module',
    cacheDirectory: true,
    cacheCompression: false,
    presets,
    plugins,
  };
};
