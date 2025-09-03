#!/usr/bin/env node

import { Command } from 'commander';
import prompts from 'prompts';

import packageJson from '@sku-lib/create/package.json' with { type: 'json' };
import { createProject } from './actions/createProject.js';

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

    if (!selectedTemplate) {
      console.log('❌ No template selected. Exiting.');
      process.exit(1);
    }

    try {
      await createProject({
        projectName,
        template: selectedTemplate as 'webpack' | 'vite',
      });
    } catch (error) {
      console.error(
        '❌ Error creating project:',
        error instanceof Error ? error.message : error,
      );
      process.exit(1);
    }
  });

program.parse();
