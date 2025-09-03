import { packageManager } from '@sku-lib/utils';
import { spawn } from 'node:child_process';

export const installDependencies = async (
  projectPath: string,
): Promise<void> => {
  console.log('📦 Installing dependencies...');
  console.log(`Using ${packageManager}`);

  return new Promise((resolvePromise, reject) => {
    const installCommand = getInstallCommand();
    const [command, ...args] = installCommand.split(' ');

    const child = spawn(command, args, {
      cwd: projectPath,
      stdio: ['inherit', 'inherit', 'inherit'],
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Installation failed with exit code ${code}`));
        return;
      }
      console.log('✅ Dependencies installed successfully');
      resolvePromise();
    });
  });
};

const getInstallCommand = (): string => {
  switch (packageManager) {
    case 'npm':
      return 'npm install';
    case 'yarn':
      return 'yarn install';
    case 'pnpm':
      return 'pnpm install';
    default:
      return 'npm install';
  }
};
