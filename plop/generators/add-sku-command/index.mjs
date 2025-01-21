import fs from 'node:fs';

const getCommandsList = () => {
  const commands = fs.readdirSync('./packages/sku/src/program/commands', {
    encoding: 'utf-8',
  });
  return commands.filter((command) => command !== 'index.ts');
};

const addSkuCommandGenerator = (plop) => {
  const subCommands = getCommandsList();

  plop.setGenerator('add-sku-command', {
    description: 'Create a new command for sku',
    prompts: [
      {
        type: 'confirm',
        name: 'isSubCommand',
        message: 'Is this a subcommand? (y/n)',
      },
      {
        type: 'list',
        name: 'parentCommand',
        message: 'Select subcommand',
        choices: subCommands,
        when: (answers) => answers.isSubCommand,
      },
      {
        type: 'input',
        name: 'commandName',
        message: 'the name of the command, kebab-case',
      },
    ],
    actions: (data) => {
      // check if parent has subcommands.
      const hasExistingSubCommands = fs.existsSync(
        `./packages/sku/src/program/commands/${data.parentCommand}/commands`,
      );
      return [
        {
          type: 'add',
          templateFile:
            './plop/generators/add-sku-command/templates/command.hbs',
          path: `./packages/sku/src/program/commands/${
            data.isSubCommand ? `{{parentCommand}}/commands/` : ''
          }{{commandName}}/{{commandName}}.command.ts`,
        },
        {
          type: 'add',
          templateFile:
            './plop/generators/add-sku-command/templates/action.hbs',
          path: `./packages/sku/src/program/commands/${
            data.isSubCommand ? `{{parentCommand}}/commands/` : ''
          }{{commandName}}/{{commandName}}.action.ts`,
        },
        ...(data.isSubCommand && !hasExistingSubCommands
          ? [
              {
                type: 'add',
                templateFile:
                  './plop/generators/add-sku-command/templates/command-index.hbs',
                path: `./packages/sku/src/program/commands/{{parentCommand}}/commands/index.ts`,
              },
              {
                type: 'modify',
                path: `./packages/sku/src/program/commands/{{parentCommand}}/{{parentCommand}}.command.ts`,
                pattern: /(import \{ Command } from 'commander';)/g,
                template: "$1\nimport { commands } from './commands';",
              },
              {
                type: 'modify',
                path: `./packages/sku/src/program/commands/{{parentCommand}}/{{parentCommand}}.command.ts`,
                pattern: /(export \{)/g,
                template: `for (const command of commands) {\n  {{camelCase parentCommand}}.addCommand(command);\n}\n\n$1`,
              },
            ]
          : []),
        {
          type: 'modify',
          path: `./packages/sku/src/program/commands/${
            data.isSubCommand ? `{{parentCommand}}/commands/` : ''
          }index.ts`,
          pattern: /(\/\* \[add-sku-command-generator: import] \*\/)/g,
          template:
            "import { {{camelCase commandName}}Command } from './{{commandName}}/{{commandName}}.command.ts';\n$1",
        },
        {
          type: 'modify',
          path: `./packages/sku/src/program/commands/${
            data.isSubCommand ? `{{parentCommand}}/commands/` : ''
          }index.ts`,
          pattern: /(\/\* \[add-sku-command-generator: invocation] \*\/)/g,
          template: '{{camelCase commandName}}Command,\n  $1',
        },
      ];
    },
  });
};

export default addSkuCommandGenerator;
