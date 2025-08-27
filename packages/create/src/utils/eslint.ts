import { spawn } from 'node:child_process';
import chalk from 'chalk';

const lintExtensions = ['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs'];

export const fix = async (projectPath: string): Promise<void> =>
  new Promise((resolve) => {
    console.log(chalk.cyan('Fixing code with ESLint...'));

    const eslintArgs = [
      'eslint',
      '--fix',
      '--cache', // Enable caching for better performance
      '--ext',
      lintExtensions.map((ext) => `.${ext}`).join(','), // Specify extensions
      '.',
    ];

    console.log(chalk.gray(`Running: npx ${eslintArgs.join(' ')}`));

    const child = spawn('npx', eslintArgs, {
      cwd: projectPath,
      stdio: 'pipe',
    });

    let stdout = '';
    let stderr = '';

    if (child.stdout) {
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
    }

    child.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green('✓ Code fixed with ESLint'));
        if (stdout.trim()) {
          console.log(chalk.gray('ESLint output:'));
          console.log(stdout.trim());
        }
      } else {
        console.log(chalk.yellow('⚠ ESLint fixing skipped (optional step)'));
        if (stderr.trim()) {
          console.log(chalk.gray(`ESLint errors: ${stderr.trim()}`));
        }
      }
      resolve(); // Always resolve, don't fail project creation
    });

    child.on('error', (error) => {
      console.log(
        chalk.yellow(
          `⚠ ESLint not available, skipping fixing: ${error.message}`,
        ),
      );
      resolve();
    });
  });
