"use strict";
exports.__esModule = true;
var tapable_1 = require("tapable");
function createHooks() {
    return {
        babel: new tapable_1.SyncHook(['config'])
    };
}
function applyHook(hook, hooks) {
    var apply = null;
    if (typeof hook === 'function') {
        apply = hook;
    }
    if (hook.apply && typeof hook.apply === 'function') {
        apply = hook.apply.bind(hook);
    }
    if (!apply) {
        throw new Error("Couldn't apply hook");
    }
    return apply(hooks);
}
function applyHooks(config) {
    var hooks = createHooks();
    config.forEach(function (hook) { return applyHook(hook, hooks); });
    return hooks;
}
exports.applyHooks = applyHooks;
