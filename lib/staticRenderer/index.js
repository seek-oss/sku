const createRenderer = require('./createRenderer');

module.exports = ({ clientCompiler, renderCompiler }) => {
  let renderer;
  let renderBuilding = true;
  let clientBuilding = true;

  let webpackStats;

  const renderCallbacks = [];

  const isReady = () => {
    return !renderBuilding && !clientBuilding;
  };

  function flushQueuedRequests() {
    if (isReady() && renderCallbacks.length > 0) {
      renderCallbacks.shift()({ webpackStats, renderer });
      flushQueuedRequests();
    }
  }

  function renderWhenReady(cb) {
    if (isReady()) {
      cb({ webpackStats, renderer });
    } else {
      renderCallbacks.push(cb);
    }
  }

  renderCompiler.hooks.watchRun.tap('sku-render-provider', () => {
    renderBuilding = true;
  });

  clientCompiler.hooks.watchRun.tap('sku-render-provider', () => {
    clientBuilding = true;
  });

  renderCompiler.hooks.afterEmit.tap('sku-render-provider', compilation => {
    const shouldCreateRenderer = Object.values(compilation.assets).some(
      ({ emitted }) => emitted,
    );

    if (shouldCreateRenderer) {
      renderer = createRenderer({
        fileName: 'render.js',
        compilation,
      });
    }
  });

  clientCompiler.hooks.done.tap('sku-render-provider', stats => {
    webpackStats = stats.toJson({
      hash: true,
      publicPath: true,
      assets: true,
      chunks: false,
      modules: false,
      source: false,
      errorDetails: false,
      timings: false,
    });
    clientBuilding = false;
    flushQueuedRequests();
  });

  renderCompiler.hooks.done.tap('sku-render-provider', () => {
    renderBuilding = false;

    flushQueuedRequests();
  });

  return {
    renderWhenReady,
  };
};
