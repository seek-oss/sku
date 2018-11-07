"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var babel_merge_1 = __importDefault(require("babel-merge"));
var BabelConfig = /** @class */ (function () {
    function BabelConfig(config) {
        this.config = config;
    }
    BabelConfig.prototype.merge = function (config) {
        this.config = babel_merge_1["default"](this.config, config);
    };
    BabelConfig.prototype.getConfig = function () {
        return this.config;
    };
    return BabelConfig;
}());
exports["default"] = BabelConfig;
