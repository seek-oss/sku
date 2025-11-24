import { getAddCommand } from '@sku-lib/utils';
import { spawn } from 'node:child_process';
import type { Template } from '../types/index.js';

const DEPENDENCIES = [
  'braid-design-system@latest',
  'react@latest',
  'react-dom@latest',
];

const COMMON_DEV_DEPENDENCIES = [
  '@vanilla-extract/css',
  'sku',
  '@types/react',
  '@types/react-dom',
];
const VITE_DEV_DEPENDENCIES = ['vitest'];

export const installDependencies = async (
  projectPath: string,
  { template }: { template: Template },
): Promise<void> => {
  console.log('📦 Installing dependencies...');

  // ! Re-enable this once we've resolved the issue with Renovate/Mend
  // ! @see https://github.com/renovatebot/renovate/discussions/38237
  // if (isAtLeastPnpmV10()) {
  //   await execAsync('pnpm add --config pnpm-plugin-sku', { cwd: projectPath });
  // }

  const devDeps = [...COMMON_DEV_DEPENDENCIES];
  if (template === 'vite') {
    devDeps.push(...VITE_DEV_DEPENDENCIES);
  }

  await installPackages(projectPath, DEPENDENCIES, 'prod');
  await installPackages(projectPath, devDeps, 'dev');

  console.log('✅ Dependencies installed successfully');
};

const installPackages = async (
  projectPath: string,
  deps: string[],
  type: 'dev' | 'prod',
): Promise<void> =>
  new Promise((resolve, reject) => {
    const addCommand = getAddCommand({
      deps,
      type,
      logLevel: 'regular',
      exact: false,
    });
    const [command, ...args] = addCommand.split(' ');

    const child = spawn(command, args, {
      cwd: projectPath,
      stdio: 'inherit',
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Installation failed with exit code ${code}`));
        return;
      }
      resolve();
    });
  });
