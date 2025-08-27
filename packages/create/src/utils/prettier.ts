import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import { join } from 'node:path';
import chalk from 'chalk';

const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

export const write = async (projectPath: string): Promise<void> => {
  console.log(chalk.cyan('Formatting generated files with Prettier...'));

  const prettierIgnorePath = join(projectPath, '.prettierignore');
  const ignoreExists = await fileExists(prettierIgnorePath);

  const prettierArgs = [
    'prettier',
    '--write',
    '--cache',
    ...(ignoreExists ? ['--ignore-path', '.prettierignore'] : []),
    '.',
  ];

  console.log(chalk.gray(`Running: npx ${prettierArgs.join(' ')}`));

  return new Promise((resolve) => {
    const child = spawn('npx', prettierArgs, {
      cwd: projectPath,
      stdio: 'pipe',
    });

    let stderr = '';

    if (child.stderr) {
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
    }

    child.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green('✓ Files formatted with Prettier'));
      } else {
        console.log(
          chalk.yellow('⚠ Prettier formatting skipped (optional step)'),
        );
        if (stderr) {
          console.log(chalk.gray(`Prettier output: ${stderr.trim()}`));
        }
      }
      resolve();
    });

    child.on('error', (error) => {
      console.log(
        chalk.yellow(
          `⚠ Prettier not available, skipping formatting: ${error.message}`,
        ),
      );
      resolve();
    });
  });
};
