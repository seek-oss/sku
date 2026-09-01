import { describe, beforeAll, afterAll, it, expect, vi } from 'vitest';

import fs from 'node:fs/promises';
import path from 'node:path';

import {
  configure,
  scopeToFixture as scopeToSkuFixture,
} from '@sku-private/testing-library';
import { scopeToFixture } from '@sku-private/testing-library/create';
import { normalizePackageManagerVersion } from '@sku-private/test-utils';

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

let createEnv: NodeJS.ProcessEnv;

/**
 * Links the local `packages/sku` workspace so create tests exercise this
 * commit's sku via `SKU_CREATE_SKU_SPECIFIER` instead of the published
 * registry package. A specifier (rather than workspace config) is required
 * because create writes a nested `pnpm-workspace.yaml` into the new project.
 */
const skuPackageDir = path.resolve(__dirname, '../../packages/sku');

beforeAll(async () => {
  createEnv = {
    SKU_CREATE_SKU_SPECIFIER: `sku@link:${skuPackageDir}`,
  };
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

  it('should create a ssr project', async () => {
    const result = await create(projectName, ['--template', 'ssr'], {
      spawnOpts: { env: createEnv },
    });
    expect(
      await result.findByText(
        `Creating new sku project: ${projectName} with ssr template`,
      ),
    ).toBeInTheConsole();
  });
});

describe.each(['webpack', 'vite', 'ssr'])('sku-create %s', (template) => {
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

      // Vite → SSR → Webpack
      await result.userEvent.keyboard('[ArrowDown]');
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

  it.runIf(template === 'ssr')('should create a ssr project', async () => {
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
    expect(await result.findByText('❯ SSR')).toBeInTheConsole();

    await result.userEvent.keyboard('[Enter]');

    expect(
      await result.findByText(
        `Creating new sku project: ${projectName} with ssr template`,
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
    ...(template === 'ssr'
      ? [
          'src/routes.tsx',
          'src/server.tsx',
          'src/client.tsx',
          'src/skuContext.ts',
          'src/RootLayout.tsx',
          'src/ErrorBoundary.tsx',
          'src/pages/home/home.tsx',
          'src/pages/about/about.tsx',
        ]
      : ['src/App/NextSteps.tsx']),
    ...(template === 'vite' ? ['src/vite.env.d.ts'] : []),
    'pnpm-workspace.yaml',
  ])('should create %s', async (file) => {
    const contents = await fs.readFile(fixturePath(projectName, file), 'utf-8');

    expect(stripYamlVersions(contents)).toMatchSnapshot();
  });

  it.runIf(template === 'ssr')(
    'should omit static-app files from the SSR template',
    async () => {
      await expect(
        fs.access(fixturePath(projectName, 'src/pages/home/route.ts')),
      ).rejects.toThrow();
      await expect(
        fs.access(fixturePath(projectName, 'src/App')),
      ).rejects.toThrow();
      await expect(
        fs.access(fixturePath(projectName, 'src/render.tsx')),
      ).rejects.toThrow();
    },
  );

  it.runIf(template === 'vite')('should not set buildType ssr', async () => {
    const skuConfig = await fs.readFile(
      fixturePath(projectName, 'sku.config.ts'),
      'utf-8',
    );
    expect(skuConfig).not.toContain("buildType: 'ssr'");
  });

  it('should pass lint', async () => {
    const { sku } = scopeToSkuFixture('sku-create/new-project');
    const result = await sku('lint');
    await expect(result).toMatchExitCode(0);
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
  return yamlContent.replace(
    /(?<!minimumReleaseAge):\s*[\d.]+(?:\+sha\d+-[a-f0-9]+)?.*/g,
    ': VERSION_IGNORED',
  );
}
