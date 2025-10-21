import { describe, beforeAll, afterAll, it, expect, vi } from 'vitest';
import { parseDocument, Document } from 'yaml';

import fs from 'node:fs/promises';
import { configure } from '@sku-private/testing-library';
import { scopeToFixture } from '@sku-private/testing-library/create';
import path from 'node:path';

const { create, fixturePath } = scopeToFixture('sku-create');

const timeout = 100_000;

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
  // Get the root pnpm-workspace.yaml
  const rootFile = await fs.readFile(
    path.resolve(__dirname, '../../pnpm-workspace.yaml'),
    'utf8',
  );
  const rootYaml = parseDocument(rootFile);
  const catalog = rootYaml.get('catalog');

  // Create a new workspace yaml and add the needed fields
  const newWorkspaceYaml = new Document();
  newWorkspaceYaml.set('catalog', catalog);
  newWorkspaceYaml.set('packages', ['../../packages/*']);
  newWorkspaceYaml.set('linkWorkspacePackages', true);

  return newWorkspaceYaml.toString();
};

const projectName = 'new-project';
const projectDirectory = fixturePath(projectName);

describe('template flag', () => {
  it('should create a webpack project', async () => {
    const result = await create(projectName, ['--template', 'webpack']);
    expect(
      await result.findByText(
        `Creating new sku project: ${projectName} with webpack template`,
      ),
    ).toBeInTheConsole();
  });

  it('should create a vite project', async () => {
    const result = await create(projectName, ['--template', 'vite']);
    expect(
      await result.findByText(
        `Creating new sku project: ${projectName} with vite template`,
      ),
    ).toBeInTheConsole();
  });
});

describe.each(['webpack', 'vite'])('create-sku %s', (template) => {
  beforeAll(async () => {
    await fs.rm(projectDirectory, { recursive: true, force: true });

    const workspace = await createWorkspace();

    await fs.writeFile(fixturePath('pnpm-workspace.yaml'), workspace);
  });

  afterAll(async () => {
    await fs.rm(projectDirectory, { recursive: true, force: true });
  });

  // Tests are run sequentially so this can be run first in its own test
  it.runIf(template === 'webpack')(
    'should create a webpack project',
    async () => {
      const result = await create(projectName);
      expect(
        await result.findByText(
          'Which template would you like to use?',
          {},
          { timeout },
        ),
      ).toBeInTheConsole();

      result.userEvent.keyboard('[ArrowDown]');
      expect(await result.findByText('❯ Webpack')).toBeInTheConsole();

      result.userEvent.keyboard('[Enter]');
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
    const result = await create(projectName);
    expect(
      await result.findByText(
        'Which template would you like to use?',
        {},
        { timeout },
      ),
    ).toBeInTheConsole();

    expect(await result.findByText('❯ Vite')).toBeInTheConsole();

    result.userEvent.keyboard('[Enter]');

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
  ])('should create %s', async (file) => {
    const contents = await fs.readFile(fixturePath(projectName, file), 'utf-8');

    expect(contents).toMatchSnapshot();
  });

  it('should update the pnpm-workspace.yaml', async () => {
    const rootFile = await fs.readFile(
      path.resolve(fixturePath('pnpm-workspace.yaml')),
      'utf8',
    );
    const workspace = parseDocument(rootFile);
    // Delete some of the fields that we don't care about
    workspace.delete('catalog');
    workspace.delete('packages');
    workspace.delete('linkWorkspacePackages');

    expect(stripYamlVersions(workspace.toString())).toMatchSnapshot();
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

  return newPackageJson;
}

/**
 * When snapshot testing YAML files, we don't care about the specific versions.
 * This function strips version numbers from YAML content.
 */
function stripYamlVersions(yamlContent: string): string {
  // Replace version patterns like "0.0.1+sha512-..." with "VERSION_IGNORED"
  return yamlContent.replace(
    /:\s*[\d.]+(?:\+sha\d+-[a-f0-9]+)?.*/g,
    ': VERSION_IGNORED',
  );
}
