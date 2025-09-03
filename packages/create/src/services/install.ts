import { getAddCommand } from '@sku-lib/utils';
import { spawn } from 'node:child_process';

const DEPENDENCIES = [
  'braid-design-system@latest',
  'react@latest',
  'react-dom@latest',
];

const DEV_DEPENDENCIES = [
  '@vanilla-extract/css',
  'sku@^14.11.0',
  '@types/react',
  '@types/react-dom',
];

export const installDependencies = async (
  projectPath: string,
): Promise<void> => {
  console.log('📦 Installing dependencies...');

  await installPackages(projectPath, DEPENDENCIES, 'prod');
  await installPackages(projectPath, DEV_DEPENDENCIES, 'dev');

  console.log('✅ Dependencies installed successfully');
};

const installPackages = async (
  projectPath: string,
  deps: string[],
  type: 'dev' | 'prod',
): Promise<void> =>
  new Promise((resolvePromise, reject) => {
    const addCommand = getAddCommand({
      deps,
      type,
      logLevel: 'regular',
      exact: false,
    });
    const [command, ...args] = addCommand.split(' ');

    const child = spawn(command, args, {
      cwd: projectPath,
      stdio: ['inherit', 'inherit', 'inherit'],
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Installation failed with exit code ${code}`));
        return;
      }
      resolvePromise();
    });
  });
