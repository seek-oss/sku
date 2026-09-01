import {
  describe,
  beforeAll,
  afterAll,
  it,
  expect,
  vi,
  aroundAll,
} from 'vitest';

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import {
  bundlers,
  configure,
  scopeToFixture as scopeToSkuFixture,
} from '@sku-private/testing-library';
import { scopeToFixture } from '@sku-private/testing-library/create';
import { normalizePackageManagerVersion } from '@sku-private/test-utils';

const execFileAsync = promisify(execFile);

const { create, fixturePath } = scopeToFixture('sku-create');

const timeout = 100_000;

configure({
  asyncUtilTimeout: timeout,
});

vi.setConfig({
  hookTimeout: timeout + 1000,
  testTimeout: timeout + 1000,
});

type Template = (typeof bundlers)[number];

const projectName = (template: Template) => `new-project-${template}`;
const projectDirectory = (template: Template) =>
  fixturePath(projectName(template));

let createEnv: NodeJS.ProcessEnv;

/**
 * Packs the local `packages/sku` workspace into a temporary `.tgz` so create
 * tests can install sku via `SKU_CREATE_SKU_SPECIFIER` (`sku@file:…`) instead
 * of the published registry package.
 */
const packSku = async () => {
  const packDestination = await fs.mkdtemp(
    path.join(os.tmpdir(), 'sku-create-pack-'),
  );
  const skuPackageDir = path.resolve(__dirname, '../../packages/sku');

  await execFileAsync('pnpm', ['pack', '--pack-destination', packDestination], {
    cwd: skuPackageDir,
  });

  const packedFiles = await fs.readdir(packDestination);
  const tarball = packedFiles.find((file) => file.endsWith('.tgz'));

  if (!tarball) {
    throw new Error('Expected sku pack to produce a .tgz file');
  }

  return {
    tarballPath: path.join(packDestination, tarball),
    remove: () => fs.rm(packDestination, { recursive: true, force: true }),
  };
};

aroundAll(async (runSuite) => {
  const pack = await packSku();

  createEnv = {
    SKU_CREATE_SKU_SPECIFIER: `sku@file:${pack.tarballPath}`,
    // Speed up repeat runs by preferring cached registry metadata.
    npm_config_prefer_offline: 'true',
  };

  await runSuite();

  await pack.remove();
});

afterAll(async () => {
  await Promise.all(
    bundlers.map((template) =>
      fs.rm(projectDirectory(template), {
        recursive: true,
        force: true,
      }),
    ),
  );
});

describe('template prompt', () => {
  // These tests only assert on the interactive prompt, so they skip the
  // dependency installation entirely.
  const skipInstallEnv = () => ({
    ...createEnv,
    SKU_CREATE_SKIP_INSTALL: 'true',
  });

  it.each(bundlers)(
    'should create a %s project via the interactive prompt',
    async (template) => {
      const result = await create(projectName(template), [], {
        spawnOpts: { env: skipInstallEnv() },
      });
      expect(
        await result.findByText(
          'Which template would you like to use?',
          {},
          { timeout },
        ),
      ).toBeInTheConsole();

      // Vite is the default selection; webpack requires moving down.
      if (template === 'webpack') {
        await result.userEvent.keyboard('[ArrowDown]');
      }
      const selectedOption = template === 'webpack' ? '❯ Webpack' : '❯ Vite';
      expect(await result.findByText(selectedOption)).toBeInTheConsole();

      await result.userEvent.keyboard('[Enter]');
      expect(
        await result.findByText(
          `Creating new sku project: ${projectName(template)} with ${template} template`,
        ),
      ).toBeInTheConsole();
    },
  );
});

describe('sku-create', () => {
  beforeAll(async () => {
    // Create projects simultaneously to save time.
    await Promise.all(
      bundlers.map(async (template) => {
        const result = await create(
          projectName(template),
          ['--template', template],
          {
            spawnOpts: { env: createEnv },
          },
        );
        expect(
          await result.findByText(
            `Creating new sku project: ${projectName(template)} with ${template} template`,
          ),
        ).toBeInTheConsole();
        expect(
          await result.findByText(`${projectName(template)} created`),
        ).toBeInTheConsole();
      }),
    );
  });

  for (const template of bundlers) {
    describe.concurrent(`${template}`, () => {
      // eslint-disable-next-line vitest/expect-expect
      it(`should create package.json`, async (ctx) => {
        const contents = await fs.readFile(
          fixturePath(projectName(template), 'package.json'),
          'utf-8',
        );
        const packageJson = JSON.parse(contents);

        ctx.expect(replaceDependencyVersions(packageJson)).toMatchSnapshot();
      });

      // eslint-disable-next-line vitest/expect-expect
      it.for([
        'sku.config.ts',
        '.gitignore',
        'eslint.config.mjs',
        'README.md',
        '.prettierignore',
        'src/App/NextSteps.tsx',
        ...(template !== 'webpack' ? ['src/vite.env.d.ts'] : []),
        'pnpm-workspace.yaml',
      ])(`should create %s`, async (file, ctx) => {
        const contents = await fs.readFile(
          fixturePath(projectName(template), file),
          'utf-8',
        );

        ctx.expect(stripYamlVersions(contents)).toMatchSnapshot();
      });

      it(`should pass lint`, async () => {
        const { sku } = scopeToSkuFixture(
          `sku-create/${projectName(template)}`,
        );
        const result = await sku('lint');
        await expect(result).toMatchExitCode(0);
      });
    });
  }
});

/**
 * When snapshot testing the package.json, we don't care about the specific versions of the dependencies.
 */
function replaceDependencyVersions(packageJson: Record<string, any>) {
  const newPackageJson = structuredClone(packageJson);

  // eslint-disable-next-line guard-for-in
  for (const dep in newPackageJson.dependencies) {
    newPackageJson.dependencies[dep] = 'VERSION_IGNORED';
  }

  // eslint-disable-next-line guard-for-in
  for (const dep in newPackageJson.devDependencies) {
    newPackageJson.devDependencies[dep] = 'VERSION_IGNORED';
  }

  if ('packageManager' in newPackageJson) {
    newPackageJson.packageManager = normalizePackageManagerVersion(
      newPackageJson.packageManager,
    );
  }

  return newPackageJson;
}

/**
 * When snapshot testing YAML files, we don't care about the specific versions.
 * This function strips version numbers from YAML content.
 */
function stripYamlVersions(yamlContent: string): string {
  return yamlContent
    .replace(
      /(?<!minimumReleaseAge):\s*[\d.]+(?:\+sha\d+-[a-f0-9]+)?.*/g,
      ': VERSION_IGNORED',
    )
    .replace(/sku@file:\s*.+/g, 'sku@file: VERSION_IGNORED');
}
