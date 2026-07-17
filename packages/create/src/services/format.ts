import { spawn } from 'node:child_process';
import { getRunCommand } from '@sku-private/utils';

const isStrict = () =>
  // Internal/test-only: fail create when format cannot run or exits non-zero.
  Boolean(process.env.SKU_CREATE_STRICT);

export const formatProject = async (projectPath: string): Promise<void> => {
  console.log('🎨 Formatting project...');

  return new Promise((resolve, reject) => {
    const formatCommand = getRunCommand('format');
    const [command, ...args] = formatCommand.split(' ');

    const child = spawn(command, args, {
      cwd: projectPath,
      stdio: 'inherit',
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Project formatted successfully');
        resolve();
        return;
      }

      if (!isStrict()) {
        console.warn(`⚠️ Formatting failed with exit code ${code}`);
        resolve();
        return;
      }

      reject(new Error(`format failed with exit code ${code}`));
    });

    child.on('error', (error) => {
      if (!isStrict()) {
        console.warn(`⚠️ Failed to run format command: ${error.message}`);
        resolve();
        return;
      }

      reject(error);
    });
  });
};
