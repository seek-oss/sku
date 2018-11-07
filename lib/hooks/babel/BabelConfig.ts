import merge from 'babel-merge';

export default class BabelConfig {
  private config: any;

  constructor(config) {
    this.config = config;
  }

  public merge(config) {
    this.config = merge(this.config, config);
  }

  public getConfig() {
    return this.config;
  }
}
