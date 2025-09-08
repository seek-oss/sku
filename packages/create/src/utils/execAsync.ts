import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execPromise = promisify(exec);

export const execAsync = async (
  command: string,
  options?: { cwd?: string },
): Promise<string> => {
  const { stdout } = await execPromise(command, options);
  return stdout.toString();
};
