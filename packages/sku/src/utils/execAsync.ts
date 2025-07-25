import { type ExecOptions, exec } from 'node:child_process';

export function execAsync(
  command: string,
  options?: ExecOptions,
): Promise<string> {
  return new Promise((res, rej) => {
    exec(command, options, (error, stdout) => {
      if (error) {
        rej(error);
      } else {
        res(stdout.toString());
      }
    });
  });
}
