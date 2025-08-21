import { spawn } from 'node:child_process';

export const write = async (projectPath: string): Promise<void> =>
  new Promise((resolve) => {
    console.log('Formatting generated files with Prettier...');

    const child = spawn('npx', ['prettier', '--write', '.'], {
      cwd: projectPath,
      stdio: 'pipe',
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log('✓ Files formatted with Prettier');
      } else {
        console.log('⚠ Prettier formatting skipped (optional step)');
      }
      resolve(); // Always resolve, don't fail project creation
    });

    child.on('error', () => {
      console.log('⚠ Prettier not available, skipping formatting');
      resolve();
    });
  });
