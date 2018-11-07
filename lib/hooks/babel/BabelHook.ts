import { Hooks, HookInstance } from '../index';

export interface BabelHookOptions {
  plugins: string[];
}

export default class BabelHook implements HookInstance {
  private options: BabelHookOptions;

  constructor(options: BabelHookOptions) {
    this.options = options;
  }

  public apply(hooks: Hooks) {
    const { plugins } = this.options;

    if (plugins) {
      hooks.babel.tap('BabelHook', config => config.merge({ plugins }));
    }
  }
}
