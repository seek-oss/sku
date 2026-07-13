import { describe, beforeAll, afterAll, it, expect, vi } from 'vitest';
import { parseDocument, Document } from 'yaml';

import fs from 'node:fs/promises';
import os from 'node:os';
import { configure } from '@sku-private/testing-library';
import { scopeToFixture } from '@sku-private/testing-library/create';
import path from 'node:path';
import { normalizePackageManagerVersion } from '@sku-private/test-utils';

const { create } = scopeToFixture('sku-create');

const timeout = 100_000;
const workDirs: string[] = [];

configure({
  asyncUtilTimeout: timeout,
});

vi.setConfig({
  hookTimeout: timeout + 1000,
  testTimeout: timeout + 1000,
});

/**
 * Creates a new workspace yaml with some values copied from the root workspace yaml.
 * This allows us to use the same catalog as the root workspace.
 */
const createWorkspace = async () => {
  const rootFile = await fs.readFile(
    path.resolve(__dirname, '../../pnpm-workspace.yaml'),
    'utf8',
  );
  const rootYaml = parseDocument(rootFile);

  const newWorkspaceYaml = new Document();
  newWorkspaceYaml.set('catalog', rootYaml.get('catalog'));
  newWorkspaceYaml.set('packages', ['../../packages/*']);
  newWorkspaceYaml.set('linkWorkspacePackages', true);

  return newWorkspaceYaml.toString();
};

const projectNameFor = (template: 'webpack' | 'vite') =>
  `new-project-${template}`;

const createWorkDir = async (template: string) => {
  const workDir = await fs.mkdtemp(
    path.join(os.tmpdir(), `sku-create-${template}-`),
  );
  workDirs.push(workDir);

  await fs.writeFile(
    path.join(workDir, 'pnpm-workspace.yaml'),
    await createWorkspace(),
  );

  return workDir;
};

describe('sku create', { retry: 0 }, () => {
  afterAll(async () => {
    await Promise.all(
      workDirs
        .splice(0)
        .map((workDir) => fs.rm(workDir, { recursive: true, force: true })),
    );
  });

  describe('template flag', () => {
    it('should create a webpack project', async () => {
      const workDir = await createWorkDir('template-flag-webpack');
      const projectName = 'template-flag-webpack';
      const result = await create(projectName, ['--template', 'webpack'], {
        cwd: workDir,
      });
      expect(
        await result.findByText(
          `Creating new sku project: ${projectName} with webpack template`,
        ),
      ).toBeInTheConsole();
    });

    it('should create a vite project', async () => {
      const workDir = await createWorkDir('template-flag-vite');
      const projectName = 'template-flag-vite';
      const result = await create(projectName, ['--template', 'vite'], {
        cwd: workDir,
      });
      expect(
        await result.findByText(
          `Creating new sku project: ${projectName} with vite template`,
        ),
      ).toBeInTheConsole();
    });
  });

  describe.each(['webpack', 'vite'] as const)(
    'sku-create %s',
    { concurrent: false },
    (template) => {
      const projectName = projectNameFor(template);
      let workDir = '';

      const projectPath = (...paths: string[]) =>
        path.join(workDir, projectName, ...paths);

      beforeAll(async () => {
        workDir = await createWorkDir(template);
        await fs.rm(projectPath(), { recursive: true, force: true });
      });

      afterAll(async () => {
        await fs.rm(projectPath(), { recursive: true, force: true });
      });

      it.runIf(template === 'webpack')(
        'should create a webpack project',
        async () => {
          const result = await create(projectName, [], { cwd: workDir });
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

      it.runIf(template === 'vite')(
        'should create a vite project',
        async () => {
          const result = await create(projectName, [], { cwd: workDir });
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
        },
      );

      it('should create package.json', async () => {
        const contents = await fs.readFile(
          projectPath('package.json'),
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
        const contents = await fs.readFile(projectPath(file), 'utf-8');

        expect(sanitizeSnapshot(contents, workDir)).toMatchSnapshot();
      });

      it('should update the pnpm-workspace.yaml', async () => {
        const rootFile = await fs.readFile(
          path.join(workDir, 'pnpm-workspace.yaml'),
          'utf8',
        );
        const workspace = parseDocument(rootFile);
        workspace.delete('catalog');
        workspace.delete('packages');
        workspace.delete('linkWorkspacePackages');

        expect(
          sanitizeSnapshot(workspace.toString(), workDir),
        ).toMatchSnapshot();
      });
    },
  );
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

function sanitizeSnapshot(content: string, workDir: string) {
  const workDirVariants = [`/private${workDir}`, workDir];

  let result = content;
  for (const dir of workDirVariants) {
    result = result.replaceAll(dir, '{workDir}');
  }

  return stripYamlVersions(result);
}

/**
 * When snapshot testing YAML files, we don't care about the specific versions.
 * This function replaces version patterns like "0.0.1+sha512-..." with "VERSION_IGNORED".
 */
function stripYamlVersions(yamlContent: string): string {
  return yamlContent.replace(
    /(?<!minimumReleaseAge):\s*[\d.]+(?:\+sha\d+-[a-f0-9]+)?.*/g,
    ': VERSION_IGNORED',
  );
}
