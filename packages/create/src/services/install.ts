import { getAddCommand } from '@sku-private/utils';
import { spawn } from 'node:child_process';
import { type Template, isViteBasedTemplate } from '../types/index.js';

const DEPENDENCIES = [
  'braid-design-system@latest',
  'react@latest',
  'react-dom@latest',
];

const VITE_SSR_DEPENDENCIES = ['react-router@^8'];

const COMMON_DEV_DEPENDENCIES = [
  '@vanilla-extract/css',
  '@types/react',
  '@types/react-dom',
];
const VITE_DEV_DEPENDENCIES = ['vitest'];

export const installDependencies = async (
  projectPath: string,
  { template }: { template: Template },
): Promise<void> => {
  // Internal/test-only: skip installation entirely
  if (process.env.SKU_CREATE_SKIP_INSTALL) {
    console.log('⏭️ Skipping dependency installation');
    return;
  }

  console.log('📦 Installing dependencies...');

  const deps = [...DEPENDENCIES];
  if (template === 'ssr') {
    deps.push(...VITE_SSR_DEPENDENCIES);
  }
  const devDeps = [
    ...COMMON_DEV_DEPENDENCIES,
    // Internal/test-only: install sku from a caller-supplied specifier (e.g. packed tarball).
    process.env.SKU_CREATE_SKU_SPECIFIER ?? 'sku',
  ];
  if (isViteBasedTemplate(template)) {
    devDeps.push(...VITE_DEV_DEPENDENCIES);
  }

  await installPackages(projectPath, deps, 'prod');
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
