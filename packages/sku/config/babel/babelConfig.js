const { cwd } = require('../../lib/cwd');

module.exports = ({
  target,
  lang = 'js',
  browserslist,
  displayNamesProd = false,
  removeAssertionsInProduction = true,
  hot = false,
  rootResolution = false,
}) => {
  const isBrowser = target === 'browser';
  const isJest = target === 'jest';
  const isProductionBuild = process.env.NODE_ENV === 'production';

  const plugins = [
    [
      require.resolve('babel-plugin-module-resolver'),
      {
        root: rootResolution ? [cwd()] : undefined,
        extensions: ['.mjs', '.js', '.json', '.ts', '.tsx'],
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
    plugins.push(require.resolve('babel-plugin-dynamic-import-node'));
  }

  if (isProductionBuild) {
    plugins.push(
      require.resolve('@babel/plugin-transform-react-inline-elements'),
      require.resolve('babel-plugin-transform-react-remove-prop-types'),
      require.resolve('@babel/plugin-transform-react-constant-elements'),
    );

    if (displayNamesProd) {
      plugins.push(require.resolve('babel-plugin-add-react-displayname'));
    }

    if (removeAssertionsInProduction) {
      plugins.push(require.resolve('babel-plugin-unassert'));
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
    presets,
    plugins,
  };
};
