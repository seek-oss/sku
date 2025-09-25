#!/usr/bin/env node

import { Command } from 'commander';
import prompts from 'prompts';

import packageJson from '@sku-lib/create/package.json' with { type: 'json' };
import { createProject } from './actions/createProject.js';
import type { Template } from './types/index.js';

const { name, description, version } = packageJson;

const program = new Command();

program
  .name(name)
  .description(description)
  .version(version)
  .argument('[project-name]', 'Name of the project to create')
  .option('-t, --template <template>', 'Template to use (webpack, vite)')
  .action(async (targetDir?: string, options: { template?: string } = {}) => {
    // Prompt for project name if not provided
    let finalTargetDir = targetDir;
    if (!finalTargetDir) {
      const { projectName } = await prompts({
        type: 'text',
        name: 'projectName',
        message: 'Project name (or "." for current directory):',
        initial: 'my-sku-app',
        validate: (value: string) => {
          if (!value.trim()) {
            return 'Project name is required';
          }
          return true;
        },
      });

      if (!projectName) {
        console.log('❌ No project name provided. Exiting.');
        process.exit(1);
      }

      finalTargetDir = projectName.trim();
    }

    let selectedTemplate = options.template;

    if (!selectedTemplate) {
      const { template } = await prompts({
        type: 'select',
        name: 'template',
        message: 'Which template would you like to use?',
        choices: [
          {
            title: 'Webpack',
            value: 'webpack',
            description:
              'Uses Webpack for serving and bundling your application, and Jest for running tests. Select this template for a familiar, production-ready development environment.',
          },
          {
            title: 'Vite (experimental)',
            value: 'vite',
            description:
              'NOT PRODUCTION-READY. An experimental template that uses Vite for serving and bundling your application, and Vitest for running tests. Select this template to experiment with upcoming features.',
          },
        ],
        initial: 0,
      });

      selectedTemplate = template;
    }

    if (selectedTemplate === 'vite') {
      const { confirmVite } = await prompts({
        type: 'confirm',
        name: 'confirmVite',
        message:
          '⚠️ Vite support in sku is currently experimental and not yet suitable for production use. Continue?',
        initial: false,
      });

      if (!confirmVite) {
        console.log(
          '❌ Cancelled. Use `webpack` template for a stable production-ready experience.',
        );
        process.exit(1);
      }
    }

    if (!selectedTemplate) {
      console.log('❌ No template selected. Exiting.');
      process.exit(1);
    }

    try {
      await createProject({
        targetDir: finalTargetDir!,
        template: selectedTemplate as Template,
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
