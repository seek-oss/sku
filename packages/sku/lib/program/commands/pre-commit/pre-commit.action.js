const preCommit = require('../../../preCommit');
const { configureProject } = require('../../../utils/config-validators');

const preCommitAction = async () => {
  await configureProject();
  try {
    await preCommit();
  } catch (e) {
    process.exit(1);
  }
};

module.exports = preCommitAction;
