import preCommit from '../../../preCommit.js';
import { configureProject } from '../../../utils/configure.js';

export const preCommitAction = async () => {
  await configureProject();
  try {
    await preCommit();
  } catch {
    process.exit(1);
  }
};
