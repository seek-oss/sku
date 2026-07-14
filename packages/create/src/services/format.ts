import { spawn } from 'node:child_process';
import { getRunCommand } from '@sku-private/utils';

/**
 * When set, run this sku binary for `format` instead of the project script.
 * Used by monorepo tests to validate against unreleased behaviour.
 */
const skuBinOverride = process.env.SKU_CREATE_SKU_BIN;

export const formatProject = async (projectPath: string): Promise<void> => {
  console.log('🎨 Formatting project...');

  return new Promise((resolve) => {
    const [command, ...args] = skuBinOverride
      ? [skuBinOverride, 'format']
      : getRunCommand('format').split(' ');

    const child = spawn(command, args, {
      cwd: projectPath,
      stdio: 'inherit',
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Project formatted successfully');
      } else if (code === 1) {
        console.log('⚠️ Formatting completed with warnings');
      } else {
        console.warn(`⚠️ Formatting failed with exit code ${code}`);
      }
      resolve();
    });

    child.on('error', (error) => {
      console.warn(`⚠️ Failed to run format command: ${error.message}`);
      resolve();
    });
  });
};
