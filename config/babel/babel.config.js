module.exports = ({ webpack }) => {
  const es2015Options = webpack ? { modules: false } : {};
  const plugins = [
    require.resolve('babel-plugin-transform-class-properties'),
    require.resolve('babel-plugin-transform-object-rest-spread'),
    [
      require.resolve('babel-plugin-module-resolver'),
      {
        root: [process.cwd()]
      }
    ],
    require.resolve('react-hot-loader/babel')
  ];

  if (webpack) {
    plugins.push([
      require.resolve('babel-plugin-transform-imports'),
      {
        'seek-style-guide/react': {
          transform: 'seek-style-guide/react/${member}/${member}',
          preventFullImport: true
        }
      }
    ]);
  }

  return {
    babelrc: false,
    presets: [
      [require.resolve('babel-preset-es2015'), es2015Options],
      require.resolve('babel-preset-react')
    ],
    plugins,
    env: {
      production: {
        presets: [require.resolve('babel-preset-react-optimize')]
      }
    }
  };
};
