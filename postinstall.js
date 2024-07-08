/**
 * Keeps the .nvmrc file in sync with the node version defined in the volta config in the monorepo's package.json
 */

const { writeFileSync } = require('node:fs');
const {
  volta: { node: nodeVersion },
} = require('./package.json');

writeFileSync('./.nvmrc', `${nodeVersion}\n`);

/**
 * Keeps the current node target for use with `@babel/preset-env` in sync with the node version defined in the engines config in sku's package.json
 */

const {
  engines: { node },
} = require('./packages/sku/package.json');

const [, minimumSupportedVersion] = node.split('=');
const targets = { currentNode: `node ${minimumSupportedVersion}` };
const prettier = require('prettier');

writeFileSync(
  './packages/sku/config/webpack/targets.json',
  prettier.format(JSON.stringify(targets, null, 2), { parser: 'json' }),
);
