const { sites } = require('../context');

module.exports = (hostname) => {
  if (sites.length === 0) {
    return undefined;
  }

  const matchingSite = sites.find((site) => site.host === hostname);

  return matchingSite ? matchingSite.name : sites[0].name;
};
