module.exports = {
  target: 'foo/bar',
  storybookTarget: 'storybook/foobar',
  dangerouslySetESLintConfig: (config) => {
    config.rules = config.rules || {};
    config.rules['no-console'] = 0;
    return config;
  },
};
