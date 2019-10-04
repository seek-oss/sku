const fs = require('fs-extra');
const glob = require('fast-glob');
const semver = require('semver');
const chalk = require('chalk');
const wrap = require('wrap-ansi');
const identString = require('indent-string');
const detectYarn = require('./detectYarn');
const { cwd, getPathFromCwd } = require('../lib/cwd');
const { paths } = require('../context');

const bannerMessage = (heading, messages = []) => {
  const formatedMessages = messages
    .map(message => identString(wrap(message, 80), 4))
    .join('\n\n');

  console.log(chalk`
{red -------------------------------------------------------------------------------------------}

    {red.bold ${heading}}

${formatedMessages}

{red -------------------------------------------------------------------------------------------}
`);
};

const asyncMap = (list, fn) => {
  return Promise.all(list.map(item => fn(item)));
};

module.exports = async () => {
  try {
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
        const messages = [
          chalk`Multiple copies of {bold ${compilePackage}} are present in node_modules. This is likely to cause errors, but even if it works, it will probably result in an unnecessarily large bundle size.`,
        ];

        messages.push(
          results
            .map(depLocation => {
              const { version } = require(getPathFromCwd(depLocation));

              return chalk`${depLocation.replace(
                '/package.json',
                '',
              )} ({bold ${version}})`;
            })
            .join('\n'),
        );

        if (detectYarn()) {
          messages.push(
            chalk`Try running "{blue.bold yarn why} {bold ${compilePackage}}" to diagnose the issue`,
          );
        }

        bannerMessage('Error: Duplicate packages detected', messages);
      }

      packages.push(...results);
    }

    const compilePackages = new Map();

    await asyncMap(packages, async p => {
      const contents = await fs.readFile(getPathFromCwd(p), {
        encoding: 'utf8',
      });

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

          const errorMessage = chalk`{bold ${packageName}} expected to find {bold ${peerName}} {yellow ${peerVersionRange}} but found {yellow ${dep.version}}.`;

          const peerBehindMessage = chalk`The best way to fix this is for {bold ${packageName}} to update its peer dependency on {bold ${peerName}}.`;

          const peerAheadMessage = chalk`The best way to fix this is to update your dependency on {bold ${peerName}}.`;

          bannerMessage('Warning: Package version mismatch', [
            errorMessage,
            peerIsBehind ? peerBehindMessage : peerAheadMessage,
          ]);
        }
      }
    }
  } catch (e) {
    console.log('Error validating peer dependencies');
    console.error(e);
  }
};
