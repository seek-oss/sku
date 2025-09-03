import { spawn } from 'node:child_process';

export const formatProject = async (projectPath: string): Promise<void> => {
  console.log('🎨 Formatting project...');

  return new Promise((resolve) => {
    const child = spawn('npm', ['run', 'format'], {
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
