import {
  describe,
  beforeAll,
  afterAll,
  it,
  expect as globalExpect,
  vi,
} from 'vitest';
import { parseDocument, Document } from 'yaml';

import fs from 'node:fs/promises';
import { scopeToFixture } from '@sku-private/testing-library';
import path from 'node:path';

const { sku, fixturePath } = scopeToFixture('sku-init');

const projectName = 'new-project';
const projectDirectory = fixturePath(projectName);

const timeout = 100_000;

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

describe('sku init', () => {
  beforeAll(async () => {
    await fs.rm(projectDirectory, { recursive: true, force: true });

    const workspace = await createWorkspace();

    await fs.writeFile(fixturePath('pnpm-workspace.yaml'), workspace);

    const result = await sku('init', [projectName]);
    globalExpect(
      await result.findByText('Project created', {}, { timeout }),
    ).toBeInTheConsole();
  });

  afterAll(async () => {
    await fs.rm(projectDirectory, { recursive: true, force: true });
  });

  it('should create package.json', async ({ expect }) => {
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
    '.prettierignore',
    'eslint.config.mjs',
    'README.md',
    'src/App/NextSteps.tsx',
  ])('should create %s', async (file, { expect }) => {
    const contents = await fs.readFile(fixturePath(projectName, file), 'utf-8');

    expect(contents).toMatchSnapshot();
  });

  it('should update the pnpm-workspace.yaml', async ({ expect }) => {
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
 *
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
 *
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
