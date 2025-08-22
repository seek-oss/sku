#!/usr/bin/env node

import { Command } from 'commander';
import { createProject } from './actions/createProject.js';

const program = new Command();

program
  .name('@sku-lib/create')
  .description('Create new sku projects')
  .version('1.0.0')
  .argument('[project-name]', 'Project name')
  .option(
    '--template <type>',
    'Template to use (webpack, vite, ssr)',
    'interactive',
  )
  .option(
    '--verbose',
    "Sets the underlying packageManager's log level to `verbose`",
  )
  .action(async (projectName, options) => {
    await createProject(projectName, options);
  });

program.parse();
