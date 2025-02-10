// @ts-check
/**
 * Keeps the .nvmrc file in sync with the node version defined in the volta config in the monorepo's package.json
 */

import { readFile, writeFile } from 'node:fs/promises';
import { format } from 'prettier';

const packageJson = await readFile('./package.json', 'utf-8');
const {
  volta: { node: nodeVersion },
} = JSON.parse(packageJson);

await writeFile('./.nvmrc', `${nodeVersion}\n`);

/**
 * Keeps the current node target for use with `@babel/preset-env` in sync with the node version defined in the
 * engines config in sku's package.json. `browserlist` doesn't seem to support node 18.20 yet, so
 * for now it's just using the major version.
 */
const skuPackageJson = await readFile('./packages/sku/package.json', 'utf-8');
const {
  engines: { node },
} = JSON.parse(skuPackageJson);

const [, minimumSupportedVersion] = node.split('=');
const targets = {
  // https://github.com/browserslist/browserslist?tab=readme-ov-file#full-list
  browserslistNodeTarget: `node ${minimumSupportedVersion}`,
};

await writeFile(
  './packages/sku/src/config/targets.json',
  await format(JSON.stringify(targets, null, 2), { parser: 'json' }),
);
