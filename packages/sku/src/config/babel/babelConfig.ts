import { cwd } from '@/utils/cwd.js';
import { createRequire } from 'node:module';
import type { PluginItem } from '@babel/core';
import { rootResolutionFileExtensions } from '../fileResolutionExtensions.js';

const require = createRequire(import.meta.url);

type BabelConfigOptions = {
  target: 'node' | 'browser' | 'jest';
  lang: 'js' | 'ts';
  browserslist?: string[];
  displayNamesProd?: boolean;
  removeAssertionsInProduction?: boolean;
  hot?: boolean;
  rootResolution?: boolean;
};

export default ({
  target,
  lang = 'js',
  browserslist,
  displayNamesProd = false,
  removeAssertionsInProduction = true,
  hot = false,
  rootResolution = false,
}: BabelConfigOptions) => {
  const isBrowser = target === 'browser';
  const isJest = target === 'jest';
  const isProductionBuild = process.env.NODE_ENV === 'production';

  const plugins: PluginItem[] = [
    [
      require.resolve('babel-plugin-module-resolver'),
      {
        root: rootResolution ? [cwd()] : undefined,
        extensions: rootResolutionFileExtensions,
      },
    ],
    require.resolve('babel-plugin-macros'),
    require.resolve('@loadable/babel-plugin'),
    require.resolve('@babel/plugin-transform-runtime'),
  ];

  if (hot && isBrowser) {
    plugins.push([
      require.resolve('react-refresh/babel'),
      { skipEnvCheck: true },
    ]);
  }

  if (isJest) {
    plugins.push([
      require.resolve('babel-plugin-transform-remove-imports'),
      {
        test: /\.css$/,
        remove: 'effects',
      },
    ]);
  }

  if (isProductionBuild) {
    plugins.push(
      require.resolve('babel-plugin-transform-react-remove-prop-types'),
      require.resolve('@babel/plugin-transform-react-constant-elements'),
    );

    if (displayNamesProd) {
      plugins.push(require.resolve('@zendesk/babel-plugin-react-displayname'));
    }

    if (removeAssertionsInProduction) {
      plugins.push([
        require.resolve('babel-plugin-unassert'),
        {
          variables: ['assert', 'invariant'],
          modules: ['assert', 'node:assert', 'tiny-invariant'],
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
  ].filter(Boolean);

  return {
    babelrc: false,
    sourceType: isBrowser ? 'unambiguous' : 'module',
    // `babel-jest` does not support the `cacheDirectory` option.
    // It is only used by `babel-loader`.
    ...(!isJest
      ? {
          cacheDirectory: true,
          cacheCompression: false,
        }
      : {}),
    presets,
    plugins,
  };
};
