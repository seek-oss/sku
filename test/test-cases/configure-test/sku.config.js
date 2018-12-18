module.exports = {
  target: 'foo/bar',
  dangerouslySetESLintConfig: config => {
    config.rules = config.rules || {};
    config.rules['no-console'] = 0;
    return config;
  }
};
