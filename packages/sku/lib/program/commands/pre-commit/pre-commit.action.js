const preCommit = require('../../../preCommit');
const { configureProject } = require('../../../utils/configure');

const preCommitAction = async () => {
  await configureProject();
  try {
    await preCommit();
  } catch {
    process.exit(1);
  }
};

module.exports = preCommitAction;
