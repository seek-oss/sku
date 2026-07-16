import { describe, beforeAll, afterAll, it, expect, vi } from 'vitest';

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { configure } from '@sku-private/testing-library';
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

const projectName = 'new-project';
const projectDirectory = fixturePath(projectName);

let pack: Awaited<ReturnType<typeof packSku>>;
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

beforeAll(async () => {
  pack = await packSku();

  createEnv = {
    SKU_CREATE_SKU_SPECIFIER: `sku@file:${pack.tarballPath}`,
    SKU_CREATE_STRICT: '1',
  };
});

afterAll(async () => {
  await pack.remove();
});

describe('template flag', () => {
  it('should create a webpack project', async () => {
    const result = await create(projectName, ['--template', 'webpack'], {
      spawnOpts: { env: createEnv },
    });
    expect(
      await result.findByText(
        `Creating new sku project: ${projectName} with webpack template`,
      ),
    ).toBeInTheConsole();
  });

  it('should create a vite project', async () => {
    const result = await create(projectName, ['--template', 'vite'], {
      spawnOpts: { env: createEnv },
    });
    expect(
      await result.findByText(
        `Creating new sku project: ${projectName} with vite template`,
      ),
    ).toBeInTheConsole();
  });
});

describe.each(['webpack', 'vite'])('sku-create %s', (template) => {
  beforeAll(async () => {
    await fs.rm(projectDirectory, { recursive: true, force: true });
  });

  afterAll(async () => {
    await fs.rm(projectDirectory, { recursive: true, force: true });
  });

  // Tests are run sequentially so this can be run first in its own test
  it.runIf(template === 'webpack')(
    'should create a webpack project',
    async () => {
      const result = await create(projectName, [], {
        spawnOpts: { env: createEnv },
      });
      expect(
        await result.findByText(
          'Which template would you like to use?',
          {},
          { timeout },
        ),
      ).toBeInTheConsole();

      await result.userEvent.keyboard('[ArrowDown]');
      expect(await result.findByText('❯ Webpack')).toBeInTheConsole();

      await result.userEvent.keyboard('[Enter]');
      expect(
        await result.findByText(
          `Creating new sku project: ${projectName} with webpack template`,
        ),
      ).toBeInTheConsole();

      expect(
        await result.findByText(`${projectName} created`),
      ).toBeInTheConsole();
    },
  );

  it.runIf(template === 'vite')('should create a vite project', async () => {
    const result = await create(projectName, [], {
      spawnOpts: { env: createEnv },
    });
    expect(
      await result.findByText(
        'Which template would you like to use?',
        {},
        { timeout },
      ),
    ).toBeInTheConsole();

    expect(await result.findByText('❯ Vite')).toBeInTheConsole();

    await result.userEvent.keyboard('[Enter]');

    expect(
      await result.findByText(
        `Creating new sku project: ${projectName} with vite template`,
      ),
    ).toBeInTheConsole();

    expect(
      await result.findByText(`${projectName} created`),
    ).toBeInTheConsole();
  });

  it('should create package.json', async () => {
    const contents = await fs.readFile(
      fixturePath(projectName, 'package.json'),
      'utf-8',
    );
    const packageJson = JSON.parse(contents);

    expect(replaceDependencyVersions(packageJson)).toMatchSnapshot();
  });

  it.for([
    'sku.config.ts',
    '.gitignore',
    'eslint.config.mjs',
    'README.md',
    '.prettierignore',
    'src/App/NextSteps.tsx',
    'pnpm-workspace.yaml',
  ])('should create %s', async (file) => {
    const contents = await fs.readFile(fixturePath(projectName, file), 'utf-8');

    expect(stripYamlVersions(contents)).toMatchSnapshot();
  });
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
