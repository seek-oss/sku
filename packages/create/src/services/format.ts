import { spawn } from 'node:child_process';
import { getRunCommand } from '@sku-lib/utils';

export const formatProject = async (projectPath: string): Promise<void> => {
  console.log('🎨 Formatting project...');

  return new Promise((resolve) => {
    const formatCommand = getRunCommand('format');
    const [command, ...args] = formatCommand.split(' ');

    const child = spawn(command, args, {
      cwd: projectPath,
      stdio: 'inherit',
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Project formatted successfully');
      } else {
        console.log('⚠️ Formatting completed with warnings');
      }
      resolve();
    });
  });
};
