import fs from "node:fs";

const getCommandsList = () => {
  const commands = fs.readdirSync('./lib/program/commands', { encoding: 'utf-8' });
  return commands.filter((command) => command !== 'index.js');
}


const addCommandGenerator = (plop) => {
  const subCommands = getCommandsList();

  plop.setGenerator('add-command', {
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
      const hasExistingSubCommands=  fs.existsSync(`./lib/program/commands/${data.parentCommand}/commands`);

      console.log('parentCommand', data)

      return [
        {
          type: 'add',
          templateFile: './plop/generators/add-command/templates/command.hbs',
          path: `./lib/program/commands/${data.isSubCommand ? `{{parentCommand}}/commands/` : ''}{{commandName}}/{{commandName}}.command.js`,
        },
        {
          type: 'add',
          templateFile: './plop/generators/add-command/templates/action.hbs',
          path: `./lib/program/commands/${data.isSubCommand ? `{{parentCommand}}/commands/` : ''}{{commandName}}/{{commandName}}.action.js`,
        },
        ...(!hasExistingSubCommands
          ? [{
              type: 'add',
              templateFile: './plop/generators/add-command/templates/command-index.hbs',
              path: `./lib/program/commands/{{parentCommand}}/commands/index.js`,
            },
            {
              type: 'modify',
              path: `./lib/program/commands/{{parentCommand}}/{{parentCommand}}.command.js`,
              pattern: /(const \{ Command } = require\('commander'\);)/g,
              template:
                "$1\nconst commands = require('./commands');",
            },
            {
              type: 'modify',
              path: `./lib/program/commands/{{parentCommand}}/{{parentCommand}}.command.js`,
              pattern: /(module\.exports =)/g,
              template:
                `for (const command of commands) {\n  {{camelCase parentCommand}}.addCommand(command);\n}\n\n$1`,
            }]
          : []
        ),
        {
          type: 'modify',
          path: `./lib/program/commands/${data.isSubCommand ? `{{parentCommand}}/commands/` : ''}index.js`,
          pattern: /(\/\* \[add-command-generator: import] \*\/)/g,
          template:
            "const {{camelCase commandName}}Command = require('./{{commandName}}/{{commandName}}.command.js');\n$1",
        },
        {
          type: 'modify',
          path: `./lib/program/commands/${data.isSubCommand ? `{{parentCommand}}/commands/` : ''}index.js`,
          pattern: /(\/\* \[add-command-generator: invocation] \*\/)/g,
          template:
            "{{camelCase commandName}}Command,\n  $1",
        },
      ]
    },
  });
}

export default addCommandGenerator;
