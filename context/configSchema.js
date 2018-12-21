const Schema = require('validate');

const jsTsFile = val => /\.(js|ts|tsx)$/.test(val);

const schema = new Schema({
  clientEntry: {
    type: String,
    required: true,
    use: { jsTsFile }
  },
  renderEntry: {
    type: String,
    required: true,
    use: { jsTsFile }
  },
  serverEntry: {
    type: String,
    required: true,
    use: { jsTsFile }
  },
  libraryEntry: {
    type: String,
    required: false,
    use: { jsTsFile }
  },
  routes: {
    type: Array,
    each: {
      name: {
        type: String,
        required: true
      },
      route: {
        type: String,
        required: true
      },
      entry: {
        type: String,
        required: false
      }
    },
    length: { min: 1 },
    required: true
  },
  sites: {
    type: Array,
    each: { type: String, required: true },
    required: true
  },
  environments: {
    type: Array,
    each: { type: String, required: true },
    required: true
  },
  transformOutputPath: {
    type: Function,
    required: true
  },
  devTransformOutputPath: {
    type: Function,
    required: true
  },
  srcPaths: {
    type: Array,
    each: {
      type: String,
      required: true
    },
    length: { min: 1 },
    required: true
  },
  env: {
    type: Object,
    required: true
  },
  compilePackages: {
    type: Array,
    each: {
      type: String,
      required: true
    },
    required: true
  },
  hosts: {
    type: Array,
    each: {
      type: String,
      required: true
    },
    required: true
  },
  port: {
    type: Number,
    required: true
  },
  serverPort: {
    type: Number,
    required: true
  },
  storybookPort: {
    type: Number,
    required: true
  },
  target: {
    type: String,
    required: true
  },
  setupTests: {
    type: String,
    required: false
  },
  initialPath: {
    type: String,
    required: false
  },
  public: {
    type: String,
    required: true
  },
  publicPath: {
    type: String,
    required: true
  },
  polyfills: {
    type: Array,
    each: {
      type: String,
      required: true
    },
    required: true
  },
  libraryName: {
    type: String,
    required: false
  },
  dangerouslySetWebpackConfig: {
    type: Function,
    required: true
  },
  dangerouslySetJestConfig: {
    type: Function,
    required: true
  },
  dangerouslySetESLintConfig: {
    type: Function,
    required: true
  },
  supportedBrowsers: {
    type: Array,
    each: {
      type: String,
      required: true
    },
    required: true
  }
});

schema.message({
  jsTsFile: path => `${path} must be a js or ts file`
});

module.exports = schema;
