module.exports = {
  entry: {
    client: 'src/client.tsx',
    render: 'src/render.tsx',
    server: 'src/server.tsx'
  },
  // Use 'dangerouslySetESLintConfig' so we can
  // check that overrides are written to disk.
  dangerouslySetESLintConfig: config => {
    config.rules = config.rules || {};
    config.rules['no-console'] = 0;

    return config;
  }
};
