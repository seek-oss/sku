const fs = require('fs-extra');
const glob = require('fast-glob');
const semver = require('semver');
const chalk = require('chalk');
const wrap = require('wrap-ansi');
const identString = require('indent-string');
const { cwd, getPathFromCwd } = require('../lib/cwd');
const { paths } = require('../context');

const prepareMessage = (value, indent = 1) =>
  identString(wrap(value, 80), indent * 4);

const asyncMap = (list, fn) => {
  return Promise.all(list.map(item => fn(item)));
};

module.exports = async () => {
  const packages = [];

  for (const compilePackage of paths.compilePackages) {
    const results = await glob(
      [
        `node_modules/${compilePackage}/package.json`,
        `node_modules/**/node_modules/${compilePackage}/package.json`,
      ],
      {
        cwd: cwd(),
      },
    );

    if (results.length > 1) {
      console.log('Duplicate compile package detected for', compilePackage);
    }

    packages.push(...results);
  }

  const compilePackages = new Map();

  await asyncMap(packages, async p => {
    const contents = await fs.readFile(getPathFromCwd(p), { encoding: 'utf8' });

    const { name, version, peerDependencies = {} } = JSON.parse(contents);

    const peers = new Map();

    Object.keys(peerDependencies)
      .filter(dep => paths.compilePackages.includes(dep))
      .forEach(dep => {
        peers.set(dep, peerDependencies[dep]);
      });

    compilePackages.set(name, { version, p, peers });
  });

  for (const [packageName, { peers }] of compilePackages.entries()) {
    for (const [peerName, peerVersionRange] of peers.entries()) {
      const dep = compilePackages.get(peerName);

      if (dep && !semver.satisfies(dep.version, peerVersionRange)) {
        const peerIsBehind = semver.gtr(dep.version, peerVersionRange);

        const errorMessage = prepareMessage(
          chalk`{bold ${packageName}} expected to find {bold ${peerName}} {yellow ${peerVersionRange}} but found {yellow ${dep.version}}.`,
        );

        const peerBehindMessage = prepareMessage(
          chalk`The best way to fix this is for {bold ${packageName}} to update its peer dependency on {bold ${peerName}}.`,
        );

        const peerAheadMessage = prepareMessage(
          chalk`The best way to fix this is to update your dependency on {bold ${peerName}}.`,
        );

        const explanation = prepareMessage(
          chalk`It's possible your app will still work, but {bold ${packageName}} is untested against this version of {bold ${peerName}}.`,
        );

        const message = chalk`
{red -------------------------------------------------------------------------------------------}

    {red.bold Warning: Package version mismatch}

${errorMessage}

${explanation}

${peerIsBehind ? peerBehindMessage : peerAheadMessage}

{red -------------------------------------------------------------------------------------------}
        `;

        console.log(message);
      }
    }
  }
};
