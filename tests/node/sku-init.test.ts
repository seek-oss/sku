import {
  describe,
  beforeAll,
  afterAll,
  it,
  expect as globalExpect,
} from 'vitest';

import fs from 'node:fs/promises';
import { scopeToFixture } from '@sku-private/testing-library';

const { sku, fixturePath } = scopeToFixture('sku-init');

const projectName = 'new-project';
const projectDirectory = fixturePath(projectName);

describe('sku init', () => {
  beforeAll(async () => {
    await fs.rm(projectDirectory, { recursive: true, force: true });
    await fs.writeFile(
      fixturePath('pnpm-workspace.yaml'),
      `
      packages:
        - ../../packages/*

      linkWorkspacePackages: true
    `,
    );

    const result = await sku('init', [projectName]);
    globalExpect(await result.findByText('Project created')).toBeInTheConsole();
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
    const contents = await fs.readFile(
      fixturePath('pnpm-workspace.yaml'),
      'utf-8',
    );

    expect(stripYamlVersions(contents)).toMatchSnapshot();
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
