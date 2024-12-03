import preCommit from '../../../preCommit.js';
import { configureProject } from '../../../utils/configure';

export const preCommitAction = async () => {
  await configureProject();
  try {
    await preCommit();
  } catch {
    process.exit(1);
  }
};
