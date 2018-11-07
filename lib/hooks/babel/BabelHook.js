"use strict";
exports.__esModule = true;
var BabelHook = /** @class */ (function () {
    function BabelHook(options) {
        this.options = options;
    }
    BabelHook.prototype.apply = function (hooks) {
        var plugins = this.options.plugins;
        if (plugins) {
            hooks.babel.tap('BabelHook', function (config) { return config.merge({ plugins: plugins }); });
        }
    };
    return BabelHook;
}());
exports["default"] = BabelHook;
