const path = require('path');
const evaluate = require('eval');

function fileExistsInCompilation(specifier, compilation) {
  const fileName = path.basename(specifier);
  return Boolean(compilation.assets[fileName]);
}

function getFileSourceFromCompilation(specifier, compilation) {
  const fileName = path.basename(specifier);
  const asset = compilation.assets[fileName];
  return asset.source();
}

function evalutateFromSource(specifier, compilation, extraModules) {
  let source;
  try {
    source = getFileSourceFromCompilation(specifier, compilation);
  } catch (error) {
    throw new Error(`Error reading "${specifier}". Error: ${error}`);
  }
  return evaluate(
    source,
    /* filename: */ specifier,
    /* scope: */ {
      require: createLinker(specifier, compilation, extraModules), // eslint-disable-line no-use-before-define
      console,
      process,
      Buffer,
    },
    /* includeGlobals: */ true,
  );
}

function createLinker(parentModulePath, compilation, extraModules) {
  return function linker(specifier) {
    if (extraModules && extraModules[specifier]) {
      console.log('Using custom module for', specifier);
      return extraModules[specifier];
    }
    const absPath = path.join(path.dirname(parentModulePath), specifier);
    if (!fileExistsInCompilation(specifier, compilation)) {
      return require(specifier);
    }
    return evalutateFromSource(absPath, compilation);
  };
}

// eslint-disable-next-line consistent-return
module.exports = function createRenderer({
  fileName,
  compilation,
  extraModules,
}) {
  if (!fileName) {
    compilation.errors.push('Missing filename');
  }
  if (!compilation) {
    compilation.errors.push('Missing compilation');
  }
  try {
    return evalutateFromSource(fileName, compilation, extraModules);
  } catch (e) {
    compilation.errors.push(e);
  }
};
