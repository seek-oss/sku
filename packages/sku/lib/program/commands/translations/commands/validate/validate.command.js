const { Command } = require('commander');

const validate = new Command('validate');

validate.description('Validate .vocab files').action(() => {
  const validateAction = require('./validate.action');
  validateAction();
});

module.exports = validate;
