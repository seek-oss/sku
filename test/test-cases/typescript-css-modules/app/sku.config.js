module.exports = {
  entry: {
    client: 'src/client.tsx',
    render: 'src/render.tsx',
    server: 'src/server.tsx'
  },
  port: 8204,
  serverPort: 8010,
  publicPath: 'http://localhost:4003',
  // Use 'dangerouslySetESLintConfig' so we can
  // check that overrides are written to disk.
  dangerouslySetESLintConfig: config => {
    config.rules = config.rules || {};
    config.rules['no-console'] = 0;

    return config;
  }
};
