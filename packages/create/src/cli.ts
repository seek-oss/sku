#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';

const program = new Command();

program
  .name('create-sku')
  .description('Create a new sku project')
  .version('0.0.0')
  .argument('[project-name]', 'Name of the project to create')
  .option('-t, --template <template>', 'Template to use (webpack, vite)')
  .action(async (projectName: string = '.', options: { template?: string }) => {
    // Prompt for template if not provided via CLI option
    const template =
      options.template ||
      (
        await inquirer.prompt([
          {
            type: 'list',
            name: 'template',
            message: 'Which template would you like to use?',
            choices: ['webpack', 'vite'],
            default: 'webpack',
          },
        ])
      ).template;

    console.log('🚧 create-sku is not yet implemented');
    console.log(`Project name: ${projectName}`);
    console.log(`Template: ${template}`);
  });

program.parse();
