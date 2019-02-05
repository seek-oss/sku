const Validator = require('fastest-validator');

const validator = new Validator();

module.exports = validator.compile({
  clientEntry: {
    type: 'string'
  },
  renderEntry: {
    type: 'string'
  },
  serverEntry: {
    type: 'string'
  },
  libraryEntry: {
    type: 'string',
    optional: true
  },
  routes: {
    type: 'array',
    items: {
      type: 'object',
      props: {
        route: {
          type: 'string'
        },
        name: {
          type: 'string',
          optional: true
        },
        entry: {
          type: 'string',
          optional: true
        }
      }
    },
    min: 1
  },
  sites: {
    type: 'array',
    items: [
      { type: 'string' },
      {
        type: 'object',
        props: {
          name: { type: 'string' },
          host: { type: 'string', optional: true }
        }
      }
    ]
  },
  environments: {
    type: 'array',
    items: 'string'
  },
  transformOutputPath: {
    type: 'function'
  },
  srcPaths: {
    type: 'array',
    items: 'string',
    min: 1
  },
  env: {
    type: 'object'
  },
  compilePackages: {
    type: 'array',
    items: 'string'
  },
  hosts: {
    type: 'array',
    items: 'string'
  },
  port: {
    type: 'number'
  },
  serverPort: {
    type: 'number'
  },
  storybookPort: {
    type: 'number'
  },
  target: {
    type: 'string'
  },
  setupTests: {
    type: 'string',
    optional: true
  },
  initialPath: {
    type: 'string',
    optional: true
  },
  public: {
    type: 'string'
  },
  publicPath: {
    type: 'string'
  },
  polyfills: {
    type: 'array',
    items: 'string'
  },
  libraryName: {
    type: 'string',
    optional: true
  },
  dangerouslySetWebpackConfig: {
    type: 'function'
  },
  dangerouslySetJestConfig: {
    type: 'function'
  },
  dangerouslySetESLintConfig: {
    type: 'function'
  },
  supportedBrowsers: {
    type: 'array',
    items: {
      type: 'string'
    }
  },
  sourceMapsProd: {
    type: 'boolean'
  }
});
