#!/usr/bin/env node

import { Command } from 'commander';
import prompts from 'prompts';

import packageJson from '../package.json' with { type: 'json' };

const { name, description, version } = packageJson;

const program = new Command();

program
  .name(name)
  .description(description)
  .version(version)
  .argument('[project-name]', 'Name of the project to create')
  .option('-t, --template <template>', 'Template to use (webpack, vite)')
  .action(async (projectName: string = '.', options: { template?: string }) => {
    let selectedTemplate = options.template;

    if (!selectedTemplate) {
      const { template } = await prompts({
        type: 'select',
        name: 'template',
        message: 'Which template would you like to use?',
        choices: [
          { title: 'webpack', value: 'webpack' },
          { title: 'vite', value: 'vite' },
        ],
        initial: 0,
      });

      selectedTemplate = template;
    }

    console.log('🚧 create-sku is not yet implemented');
    console.log(`Project name: ${projectName}`);
    console.log(`Template: ${selectedTemplate}`);
  });

program.parse();
