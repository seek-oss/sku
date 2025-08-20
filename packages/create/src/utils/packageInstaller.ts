import { spawn } from 'node:child_process';
import { packageManager } from './packageManager.js';

interface InstallOptions {
  deps: string[];
  type?: 'dev' | 'regular';
  logLevel?: 'verbose' | 'regular';
  exact?: boolean;
}

export const install = ({
  deps,
  type = 'regular',
  logLevel = 'regular',
  exact = true,
}: InstallOptions): Promise<void> => {
  return new Promise((resolve, reject) => {
    const args: string[] = [];

    // Add command
    if (packageManager === 'yarn') {
      args.push('add');
    } else {
      args.push('add');
    }

    // Add dev flag
    if (type === 'dev') {
      if (packageManager === 'yarn') {
        args.push('--dev');
      } else {
        args.push('--save-dev');
      }
    }

    // Add exact flag
    if (exact && packageManager === 'npm') {
      args.push('--save-exact');
    }

    // Add dependencies
    args.push(...deps);

    // Add log level
    if (logLevel === 'verbose') {
      if (packageManager === 'npm') {
        args.push('--verbose');
      } else if (packageManager === 'pnpm') {
        args.push('--reporter=default');
      }
    }

    const child = spawn(packageManager, args, {
      stdio: 'inherit',
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Package installation failed with exit code ${code}`));
      }
    });

    child.on('error', reject);
  });
};
