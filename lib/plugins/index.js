function applyPlugin(plugin, hooks) {
  let apply;

  if (typeof plugin === 'function') {
    apply = plugin;
  }

  if (plugin.apply && typeof plugin.apply === 'function') {
    apply = plugin.apply.bind(plugin);
  }

  if (!apply) {
    throw new Error(`Couldn't apply ${plugin.name}`);
  }

  return apply(hooks);
}

module.exports = {
  applyPlugin
};
