const Validator = require('fastest-validator');

const validator = new Validator();

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
  storybookPort: {
    type: 'number',
  },
  storybookTarget: {
    type: 'string',
  },
  provideDefaultChromaticViewports: {
    type: 'boolean',
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
  dangerouslySetWebpackConfig: {
    type: 'function',
  },
  dangerouslySetJestConfig: {
    type: 'function',
  },
  dangerouslySetESLintConfig: {
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
  playroomComponents: { type: 'string' },
  playroomThemes: { type: 'string', optional: true },
  playroomSnippets: { type: 'string', optional: true },
  playroomFrameComponent: { type: 'string', optional: true },
  playroomScope: { type: 'string', optional: true },
  playroomTarget: { type: 'string', optional: true },
  playroomWidths: {
    type: 'array',
    items: {
      type: 'number',
    },
    optional: true,
  },
  playroomPort: { type: 'number', optional: true },
  playroomTitle: { type: 'string', optional: true },
  playroomParamType: {
    type: 'enum',
    values: ['search', 'hash'],
    optional: true,
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
});
