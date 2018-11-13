const fs = require('fs');
const { fromPairs } = require('lodash');

const { getPathFromCwd } = require('../lib/cwd');

const defaultClientEntry = 'skuDefaultClientEntry';

const getClientEntries = config => {
  const entries = config.routes
    .filter(({ entry }) => Boolean(entry))
    .map(({ name, entry }) => [name, entry]);

  if (fs.existsSync(getPathFromCwd(config.entry.client))) {
    entries.push([defaultClientEntry, config.entry.client]);
  }

  return fromPairs(
    entries.map(([name, entry]) => [name, getPathFromCwd(entry)])
  );
};

module.exports = {
  defaultClientEntry,
  getClientEntries
};
