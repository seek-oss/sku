const Validator = require('fastest-validator');

const validator = new Validator();

const languagesToCompile = {
  optional: true,
  type: 'array',
  items: [
    { type: 'string' },
    {
      type: 'object',
      strict: true,
      props: {
        name: { type: 'string' },
        extends: { type: 'string', optional: true },
      },
    },
  ],
};

const languagesToRender = {
  optional: true,
  type: 'array',
  items: [{ type: 'string' }],
};

const routes = {
  type: 'array',
  items: [
    { type: 'string' },
    {
      type: 'object',
      props: {
        route: {
          type: 'string',
        },
        name: {
          type: 'string',
          optional: true,
        },
        entry: {
          type: 'string',
          optional: true,
        },
        languages: languagesToRender,
      },
    },
  ],
};

module.exports = validator.compile({
  clientEntry: {
    type: 'string',
  },
  renderEntry: {
    type: 'string',
  },
  serverEntry: {
    type: 'string',
  },
  libraryEntry: {
    type: 'string',
    optional: true,
  },
  routes,
  sites: {
    type: 'array',
    items: [
      { type: 'string' },
      {
        type: 'object',
        props: {
          name: { type: 'string' },
          host: { type: 'string', optional: true },
          routes: { ...routes, optional: true },
          languages: languagesToRender,
        },
      },
    ],
  },
  environments: {
    type: 'array',
    items: 'string',
  },
  transformOutputPath: {
    type: 'function',
  },
  srcPaths: {
    type: 'array',
    items: 'string',
    min: 1,
  },
  env: {
    type: 'object',
  },
  compilePackages: {
    type: 'array',
    items: 'string',
  },
  hosts: {
    type: 'array',
    items: 'string',
  },
  port: {
    type: 'number',
  },
  serverPort: {
    type: 'number',
  },
  target: {
    type: 'string',
  },
  setupTests: [
    {
      type: 'string',
      optional: true,
    },
    {
      type: 'array',
      items: 'string',
      optional: true,
    },
  ],
  initialPath: {
    type: 'string',
    optional: true,
  },
  public: {
    type: 'string',
  },
  publicPath: {
    type: 'string',
  },
  polyfills: {
    type: 'array',
    items: 'string',
  },
  libraryName: {
    type: 'string',
    optional: true,
  },
  libraryFile: {
    type: 'string',
    optional: true,
  },
  dangerouslySetWebpackConfig: {
    type: 'function',
  },
  dangerouslySetJestConfig: {
    type: 'function',
  },
  dangerouslySetESLintConfig: {
    type: 'function',
  },
  dangerouslySetTSConfig: {
    type: 'function',
  },
  supportedBrowsers: {
    type: 'array',
    items: {
      type: 'string',
    },
  },
  sourceMapsProd: {
    type: 'boolean',
  },
  displayNamesProd: {
    type: 'boolean',
  },
  orderImports: { type: 'boolean' },
  cspEnabled: { type: 'boolean' },
  cspExtraScriptSrcHosts: {
    type: 'array',
    items: { type: 'string' },
  },
  httpsDevServer: {
    type: 'boolean',
  },
  devServerMiddleware: {
    type: 'string',
    optional: true,
  },
  rootResolution: {
    type: 'boolean',
  },
  languages: languagesToCompile,
  skipPackageCompatibilityCompilation: {
    type: 'array',
    items: { type: 'string' },
  },
  persistentCache: {
    type: 'boolean',
  },
  externalizeNodeModules: {
    type: 'boolean',
  },
});
