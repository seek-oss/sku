import { spawn } from 'node:child_process';
import { packageManager, isYarn, isPnpm, isNpm } from './packageManager.js';

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
}: InstallOptions): Promise<void> =>
  new Promise((resolve, reject) => {
    const args: string[] = [];

    args.push('add');

    const addingDevDeps = type === 'dev';
    if (addingDevDeps) {
      const devDepFlag = isYarn ? '--dev' : '--save-dev';
      args.push(devDepFlag);
    }

    if (exact) {
      const exactFlag = isYarn ? '--exact' : '--save-exact';
      args.push(exactFlag);
    }

    if (logLevel === 'verbose') {
      if (isYarn) {
        args.push('--verbose');
      } else if (isPnpm) {
        args.push('--loglevel', 'info');
      } else if (isNpm) {
        args.push('--loglevel', 'verbose');
      }
    }
    if (logLevel !== 'verbose' && (isPnpm || isNpm)) {
      args.push('--loglevel', 'error');
    }

    args.push(...deps);

    const child = spawn(packageManager, args, {
      stdio: 'inherit',
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `Package installation failed with exit code ${code}. Command: ${packageManager} ${args.join(' ')}`,
          ),
        );
      }
    });

    child.on('error', (error) => {
      reject(new Error(`Failed to spawn ${packageManager}: ${error.message}`));
    });
  });

export const installConfig = (packageName: string): Promise<void> =>
  new Promise((resolve, reject) => {
    if (!isPnpm) {
      reject(new Error('Config dependencies are only supported with pnpm'));
      return;
    }

    const args = ['add', '--config', packageName];

    const child = spawn(packageManager, args, {
      stdio: 'inherit',
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `Config package installation failed with exit code ${code}. Command: ${packageManager} ${args.join(' ')}`,
          ),
        );
      }
    });

    child.on('error', (error) => {
      reject(new Error(`Failed to spawn ${packageManager}: ${error.message}`));
    });
  });
