import { getAddCommand, isAtLeastPnpmV10 } from '@sku-private/utils';
import { spawn } from 'node:child_process';
import type { Template } from '../types/index.js';
import { execAsync } from '../utils/execAsync.js';

const DEPENDENCIES = [
  'braid-design-system@latest',
  'react@latest',
  'react-dom@latest',
];

const COMMON_DEV_DEPENDENCIES = [
  '@vanilla-extract/css',
  // Internal/test-only: install sku from a caller-supplied specifier (e.g. packed tarball).
  process.env.SKU_CREATE_SKU_SPECIFIER ?? 'sku',
  '@types/react',
  '@types/react-dom',
];
const VITE_DEV_DEPENDENCIES = ['vitest'];

export const installDependencies = async (
  projectPath: string,
  { template }: { template: Template },
): Promise<void> => {
  console.log('📦 Installing dependencies...');

  if (isAtLeastPnpmV10()) {
    await execAsync('pnpm add --config pnpm-plugin-sku', { cwd: projectPath });
  }

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
