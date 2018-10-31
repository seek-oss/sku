module.exports = class BabelPlugin {
  constructor(options) {
    this.options = options;
  }

  apply(hooks) {
    const { plugins } = this.options;

    if (plugins) {
      hooks.babel.tap('BabelPlugin', config => config.merge({ plugins }));
    }
  }
};
