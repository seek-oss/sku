import merge from 'babel-merge';

export default class BabelConfig {
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  public merge(config: any) {
    this.config = merge(this.config, config);
  }

  public getConfig() {
    return this.config;
  }
}
