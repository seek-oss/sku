import { spawn } from 'node:child_process';

export const fix = async (projectPath: string): Promise<void> =>
  new Promise((resolve) => {
    console.log('Fixing code with ESLint...');

    const child = spawn('npx', ['eslint', '--fix', '.'], {
      cwd: projectPath,
      stdio: 'pipe',
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log('✅  Code fixed with ESLint');
      } else {
        console.log('⚠️  ESLint fixing skipped (optional step)');
      }
      resolve(); // Always resolve, don't fail project creation
    });

    child.on('error', () => {
      console.log('⚠️  ESLint not available, skipping fixing');
      resolve();
    });
  });
