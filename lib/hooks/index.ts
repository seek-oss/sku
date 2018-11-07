import { SyncHook } from 'tapable';
import BabelConfig from './babel/BabelConfig';

export interface Hooks {
  babel: SyncHook<BabelConfig>;
}

function createHooks(): Hooks {
  return {
    babel: new SyncHook(['config'])
  };
}

export type HookFunction = (hooks: Hooks) => void;

export interface HookInstance {
  apply: HookFunction;
}

export type Hook = HookFunction | HookInstance;

function applyHook(hook: Hook, hooks: Hooks) {
  let apply: HookFunction | null = null;

  if (typeof hook === 'function') {
    apply = hook as HookFunction;
  }

  if (hook.apply && typeof hook.apply === 'function') {
    apply = hook.apply.bind(hook);
  }

  if (!apply) {
    throw new Error(`Couldn't apply hook`);
  }

  return apply(hooks);
}

export function applyHooks(config: Hook[]) {
  const hooks = createHooks();

  config.forEach(hook => applyHook(hook, hooks));

  return hooks;
}
