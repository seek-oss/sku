const minimist = require('minimist');
/**
 * Supports parsing args that look like:
 * [/path/to/node/node, /path/to/sku, scriptName, arg1, arg2]
 *
 * @param {string[]} processArgv - should look like process.argv
 */
module.exports = (processArgv) => {
  /**
   * @type {string[]}
   */
  const unknown = [];

  // We are tracking unknown arguments ourselves, so we ignore `minimist`'s unknown property `_`
  const { _, ...options } = minimist(
    // The first 2 items in process.argv are /path/to/node and /path/to/sku.
    // We need the first arg we give to minimist to be the script name.
    processArgv.slice(2),
    {
      string: ['config', 'environment', 'packageManager', 'site', 'stats'],
      alias: {
        e: 'environment',
        c: 'config',
        D: 'debug',
      },
      boolean: [
        'debug',
        // Passed to Vocab in the `translations` script
        'delete-unused-keys',
      ],
      // `minimist` does not push unknown flags to `_` even if this function returns `true`, so we
      // need to track them ourselves
      unknown: (arg) => {
        unknown.push(arg);

        return true;
      },
    },
  );

  const [script, ...argv] = unknown;

  return {
    ...options,
    script,
    argv,
  };
};
