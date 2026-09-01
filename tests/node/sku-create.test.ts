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
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import {
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

const templates = ['vite', 'webpack', 'ssr'] as const;
type Template = (typeof templates)[number];

const projectName = (template: Template) => `new-project-${template}`;
const projectDirectory = (template: Template) =>
  fixturePath(projectName(template));

let createEnv: NodeJS.ProcessEnv;

/**
 * Links the local `packages/sku` workspace so create tests exercise this
 * commit's sku via `SKU_CREATE_SKU_SPECIFIER` instead of the published
 * registry package. A specifier (rather than workspace config) is required
 * because create writes a nested `pnpm-workspace.yaml` into the new project.
 */
const skuPackageDir = path.resolve(__dirname, '../../packages/sku');

const removeProjects = async () => {
  await Promise.all(
    templates.map((template) =>
      // using native os cleanup since its much faster than fs.rm for large numbers of files
      execFileAsync('rm', ['-rf', projectDirectory(template)]),
    ),
  );
};

aroundAll(async (runSuite) => {
  try {
    createEnv = {
      SKU_CREATE_SKU_SPECIFIER: `sku@link:${skuPackageDir}`,
    };

    await runSuite();
  } finally {
    // clean up even if project creation fails in beforeAll
    await removeProjects();
  }
});

afterAll(async () => {
  await removeProjects();
});

describe('interactive prompt', () => {
  // These tests only assert on the interactive prompt, so they skip the
  // dependency installation entirely.
  const skipInstallEnv = () => ({
    ...createEnv,
    SKU_CREATE_SKIP_INSTALL: 'true',
  });

  it('should create a vite project via the interactive prompt', async () => {
    const result = await create(projectName('vite'), [], {
      spawnOpts: { env: skipInstallEnv() },
    });
    expect(
      await result.findByText('Which template would you like to use?'),
    ).toBeInTheConsole();

    expect(await result.findByText('❯ Vite')).toBeInTheConsole();
    await result.userEvent.keyboard('[Enter]');
    expect(
      await result.findByText(
        `Creating new sku project: ${projectName('vite')} with vite template`,
      ),
    ).toBeInTheConsole();
  });

  it('should create a webpack project via the interactive prompt', async () => {
    const result = await create(projectName('webpack'), [], {
      spawnOpts: { env: skipInstallEnv() },
    });
    expect(
      await result.findByText('Which template would you like to use?'),
    ).toBeInTheConsole();

    // Vite → SSR → Webpack
    await result.userEvent.keyboard('[ArrowDown]');
    await result.userEvent.keyboard('[ArrowDown]');

    expect(await result.findByText('❯ Webpack')).toBeInTheConsole();
    await result.userEvent.keyboard('[Enter]');
    expect(
      await result.findByText(
        `Creating new sku project: ${projectName('webpack')} with webpack template`,
      ),
    ).toBeInTheConsole();
  });

  it('should create a ssr project via the interactive prompt', async () => {
    const result = await create(projectName('ssr'), [], {
      spawnOpts: { env: skipInstallEnv() },
    });
    expect(
      await result.findByText('Which template would you like to use?'),
    ).toBeInTheConsole();

    // Vite → SSR
    await result.userEvent.keyboard('[ArrowDown]');

    expect(await result.findByText('❯ SSR')).toBeInTheConsole();
    await result.userEvent.keyboard('[Enter]');
    expect(
      await result.findByText(
        `Creating new sku project: ${projectName('ssr')} with ssr template`,
      ),
    ).toBeInTheConsole();
  });
});

describe.concurrent('sku-create', () => {
  beforeAll(async () => {
    // Create projects simultaneously to save time.
    // This does use more system resources, but it's much faster than creating projects sequentially
    await Promise.all(
      templates.map(async (template) => {
        const result = await create(
          projectName(template),
          ['--template', template],
          {
            spawnOpts: { env: createEnv },
          },
        );
        await expect(result).toMatchExitCode(0);
      }),
    );
  });

  for (const template of templates) {
    describe(`${template}`, () => {
      const ssrFiles = [
        'src/routes.tsx',
        'src/server.tsx',
        'src/client.tsx',
        'src/skuContext.ts',
        'src/RootLayout.tsx',
        'src/ErrorBoundary.tsx',
        'src/pages/home/home.tsx',
        'src/pages/about/about.tsx',
      ];
      const viteFiles = ['src/vite.env.d.ts'];

      // eslint-disable-next-line vitest/expect-expect
      it('should create package.json', async (ctx) => {
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
        ...(template === 'ssr' ? ssrFiles : ['src/App/NextSteps.tsx']),
        ...(template === 'vite' ? viteFiles : []),
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

  it('should omit static-app files from the SSR template', async () => {
    await expect(
      fs.access(fixturePath(projectName('ssr'), 'src/pages/home/route.ts')),
    ).rejects.toThrow();
    await expect(
      fs.access(fixturePath(projectName('ssr'), 'src/App')),
    ).rejects.toThrow();
    await expect(
      fs.access(fixturePath(projectName('ssr'), 'src/render.tsx')),
    ).rejects.toThrow();
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
