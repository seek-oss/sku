/* eslint-disable */
// Original source: https://github.com/naistran/css-in-js-loader/blob/master/index.js
var path = require('path');
var fs = require('fs');
var postcss = require('postcss');
var postcssJs = require('postcss-js');
var NodeTemplatePlugin = require('webpack/lib/node/NodeTemplatePlugin');
var NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin');
var LibraryTemplatePlugin = require('webpack/lib/LibraryTemplatePlugin');
var SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');
var LimitChunkCountPlugin = require('webpack/lib/optimize/LimitChunkCountPlugin');

const CSSInJsLoader = 'css-in-js-loader';

module.exports = function(source) {
  if (this.cacheable) this.cacheable();
  return source;
};

module.exports.pitch = function(request, prevRequest) {
  if (this.cacheable) this.cacheable();
  var callback = this.async();
  if (['.js', '.ts'].indexOf(path.extname(request)) >= 0) {
    produce(this, request, callback);
  } else {
    var parts = request.split('!');
    var filename = parts[parts.length - 1];
    this.addDependency(filename);
    fs.readFile(filename, 'utf8', callback);
  }
};

function produce(loader, request, callback) {
  var childFilename = 'css-in-js-output-filename';
  var outputOptions = { filename: childFilename };
  var childCompiler = getRootCompilation(loader).createChildCompiler(
    'css-in-js-compiler',
    outputOptions,
  );
  new NodeTemplatePlugin(outputOptions).apply(childCompiler);
  new LibraryTemplatePlugin(null, 'commonjs2').apply(childCompiler);
  new NodeTargetPlugin().apply(childCompiler);
  new SingleEntryPlugin(loader.context, '!!' + request).apply(childCompiler);
  new LimitChunkCountPlugin({ maxChunks: 1 }).apply(childCompiler);
  var subCache = 'subcache ' + __dirname + ' ' + request;
  childCompiler.hooks.compilation.tap(CSSInJsLoader, function(compilation) {
    if (compilation.cache) {
      if (!compilation.cache[subCache]) compilation.cache[subCache] = {};
      compilation.cache = compilation.cache[subCache];
    }
  });
  // We set loaderContext[__dirname] = false to indicate we already in
  // a child compiler so we don't spawn another child compilers from there.
  childCompiler.hooks.thisCompilation.tap(CSSInJsLoader, function(compilation) {
    compilation.hooks.normalModuleLoader.tap(CSSInJsLoader, function(
      loaderContext,
    ) {
      loaderContext[__dirname] = false;
    });
  });
  var source;
  childCompiler.hooks.afterCompile.tapAsync(CSSInJsLoader, function(
    compilation,
    callback,
  ) {
    source =
      compilation.assets[childFilename] &&
      compilation.assets[childFilename].source();

    // Remove all chunk assets
    compilation.chunks.forEach(function(chunk) {
      chunk.files.forEach(function(file) {
        delete compilation.assets[file];
      });
    });

    callback();
  });

  childCompiler.runAsChild(function(err, entries, compilation) {
    if (err) return callback(err);

    if (compilation.errors.length > 0) {
      return callback(compilation.errors[0]);
    }
    if (!source) {
      return callback(new Error("Didn't get a result from child compiler"));
    }
    compilation.fileDependencies.forEach(function(dep) {
      loader.addDependency(dep);
    }, loader);
    compilation.contextDependencies.forEach(function(dep) {
      loader.addContextDependency(dep);
    }, loader);
    try {
      var exports = loader.exec(source, request);
      if (exports.default && typeof exports.default === 'object') {
        exports = exports.default;
      }
    } catch (e) {
      return callback(e);
    }
    if (exports) {
      postcss()
        .process(exports, { from: this.resourcePath, parser: postcssJs })
        .then(function(res) {
          callback(null, res.css);
        });
    } else {
      callback();
    }
  });
}

function getRootCompilation(loader) {
  var compiler = loader._compiler;
  var compilation = loader._compilation;
  while (compiler.parentCompilation) {
    compilation = compiler.parentCompilation;
    compiler = compilation.compiler;
  }
  return compilation;
}
