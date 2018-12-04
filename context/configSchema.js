const Schema = require('validate');

module.exports = new Schema({
  clientEntry: {
    type: String,
    required: true
  },
  renderEntry: {
    type: String,
    required: true
  },
  serverEntry: {
    type: String,
    required: true
  },
  libraryEntry: {
    type: String,
    required: false
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
