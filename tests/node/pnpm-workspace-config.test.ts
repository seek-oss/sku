import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'node:path';
import dedent from 'dedent';
import { createFixture, scopeToFixture } from '@sku-private/testing-library';

const { sku, fixturePath } = scopeToFixture('configure');

type Fixture = Awaited<ReturnType<typeof createFixture>>;
type Files = Record<string, string>;
type SkuCommand = Parameters<typeof sku>[0];

const WORKSPACE_FILE = 'pnpm-workspace.yaml';

const yaml = (strings: TemplateStringsArray, ...values: unknown[]) =>
  `${dedent(strings, ...values)}\n`;

const packageJson = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({
    name: 'pnpm-workspace-config-test',
    private: true,
    type: 'module',
    skuSkipValidatePeerDeps: true,
    ...overrides,
  });

const pnpmProject = (workspaceYaml?: string): Files => ({
  'package.json': packageJson(),
  'pnpm-lock.yaml': 'lockfileVersion: "9.0"\n',
  ...(workspaceYaml ? { [WORKSPACE_FILE]: workspaceYaml } : {}),
});

const skuApp = ({
  workspaceYaml,
  skuConfig = 'export default {};\n',
}: {
  workspaceYaml?: string;
  skuConfig?: string;
}): Files => ({
  ...pnpmProject(workspaceYaml),
  'sku.config.ts': skuConfig,
  'src/App.tsx': 'export default () => null;\n',
});

const createProject = (files: Files) =>
  createFixture(files, { tempDir: fixturePath() });

/** `sku` resolves `cwd` relative to the fixture folder holding the temp dir. */
const cwdOf = (fixture: Fixture, ...subpaths: string[]) =>
  path.relative(fixturePath(), fixture.getPath(...subpaths));

/**
 * Creates one project shared by every test in the enclosing `describe`.
 *
 * Those tests run in order and build on the state the previous one
 * left behind, so running a single one in isolation will not work.
 */
const setupSharedProject = (files: Files) => {
  let fixture: Fixture;

  beforeAll(async () => {
    fixture = await createProject(files);
  });

  afterAll(async () => {
    await fixture.rm();
  });

  return {
    /** Runs a `sku` command from the project root. */
    runSku: (command: SkuCommand, args: string[] = []) =>
      sku(command, args, { cwd: cwdOf(fixture) }),
    readWorkspaceFile: () => fixture.readFile(WORKSPACE_FILE, 'utf8'),
    writeWorkspaceFile: (content: string) =>
      fixture.writeFile(WORKSPACE_FILE, content),
    workspaceFileExists: () => fixture.exists(WORKSPACE_FILE),
  };
};

describe('pnpm-workspace-config', () => {
  describe('on a project with a drifted pnpm-workspace.yaml', () => {
    const workspaceYaml = yaml`
      packages:
        - .
      configDependencies:
        pnpm-plugin-sku: ^0.0.3
      minimumReleaseAge: 1440
      allowBuilds:
        '@parcel/watcher': true
    `;

    const project = setupSharedProject(skuApp({ workspaceYaml }));

    /** Captured once so a retry of the idempotency check cannot re-baseline itself. */
    let alignedContent: string;

    it('fails the lint check on managed drift', async () => {
      const run = await project.runSku('lint');
      await expect(run).toMatchExitCode(1);

      const output = run.getStdallStr();
      expect(output).toContain(
        'pnpm-workspace.yaml: "pnpm-plugin-sku" is present in configDependencies.',
      );
      expect(output).toContain(
        'pnpm-workspace.yaml: "blockExoticSubdeps" is missing, recommended is true.',
      );
      expect(output).toContain(
        'pnpm-workspace.yaml: "allowBuilds.@parcel/watcher" matches sku\'s default but is missing the "[sku_managed]" marker.',
      );
      expect(output).toContain('To fix this issue, run');
      // Unmarked drift is the user's to keep, so it is advisory rather than a failure
      expect(output).toContain(
        'pnpm-workspace.yaml: "minimumReleaseAge" has value 1440, recommended is 4320.',
      );
    });

    it('does not sync the file during configure', async () => {
      const run = await project.runSku('configure');
      await expect(run).toMatchExitCode(0);

      expect(await project.readWorkspaceFile()).toBe(workspaceYaml);
    });

    it('enforces the managed defaults on format', async () => {
      const run = await project.runSku('format');
      await expect(run).toMatchExitCode(0);

      alignedContent = await project.readWorkspaceFile();
      expect(alignedContent).not.toContain('configDependencies');
      expect(alignedContent).not.toContain('pnpm-plugin-sku');
      // Missing defaults are added, matching values adopted, unmarked drift preserved
      expect(alignedContent).toContain(
        'blockExoticSubdeps: true # [sku_managed]',
      );
      expect(alignedContent).toContain(
        "'@parcel/watcher': true # [sku_managed]",
      );
      expect(alignedContent).toContain('minimumReleaseAge: 1440');
    });

    it('passes the lint check once aligned, still advising on user-managed drift', async () => {
      const run = await project.runSku('lint');
      await expect(run).toMatchExitCode(0);

      const output = run.getStdallStr();
      expect(output).toContain(
        'pnpm-workspace.yaml: "minimumReleaseAge" has value 1440, recommended is 4320.',
      );
      expect(output).not.toContain('pnpm-plugin-sku');
      expect(output).not.toContain('is missing');
    });

    it('writes nothing on a second format', async () => {
      const run = await project.runSku('format');
      await expect(run).toMatchExitCode(0);
      expect(await project.readWorkspaceFile()).toBe(alignedContent);
    });
  });

  it('surfaces an unusable pnpm-workspace.yaml as a lint and format failure', async () => {
    const workspaceYaml = '- this is not a workspace config map\n';
    await using fixture = await createProject(skuApp({ workspaceYaml }));
    const cwd = cwdOf(fixture);

    const lintRun = await sku('lint', [], { cwd });
    await expect(lintRun).toMatchExitCode(1);
    expect(lintRun.getStdallStr()).toContain(
      'pnpm-workspace.yaml must contain a YAML mapping',
    );

    const formatRun = await sku('format', [], { cwd });
    await expect(formatRun).toMatchExitCode(1);
    expect(formatRun.getStdallStr()).toContain(
      'pnpm-workspace.yaml must contain a YAML mapping',
    );

    expect(await fixture.readFile(WORKSPACE_FILE, 'utf8')).toBe(workspaceYaml);
  });

  describe('configure workspace', () => {
    it('syncs the workspace root from a nested package, leaving the package untouched', async () => {
      await using fixture = await createProject({
        ...pnpmProject(yaml`
          packages:
            - 'packages/*'
          minimumReleaseAge: 1440
        `),
        'packages/app/package.json': packageJson({ name: 'app' }),
        'packages/app/src/App.tsx': 'export default () => null;\n',
      });

      const appFilesBefore = await fixture.readdir('packages/app', {
        recursive: true,
      });

      // Runs without a sku config file, from a nested package directory
      const run = await sku('configure', ['workspace'], {
        cwd: cwdOf(fixture, 'packages/app'),
      });
      await expect(run).toMatchExitCode(0);

      // The root file gains the managed defaults, keeping the user's value
      const content = await fixture.readFile(WORKSPACE_FILE, 'utf8');
      expect(content).toContain('blockExoticSubdeps: true # [sku_managed]');
      expect(content).toContain('minimumReleaseAge: 1440');

      // The package directory gains no workspace file and no emitted config
      expect(
        await fixture.readdir('packages/app', { recursive: true }),
      ).toEqual(appFilesBefore);
    });

    describe('on a project without a pnpm-workspace.yaml', () => {
      const project = setupSharedProject(pnpmProject());

      it('fails --check, pointing at the write command', async () => {
        const run = await project.runSku('configure', ['workspace', '--check']);
        await expect(run).toMatchExitCode(1);

        const output = run.getStdallStr();
        expect(output).toContain('No pnpm-workspace.yaml found');
        expect(output).toContain('sku configure workspace');
        expect(await project.workspaceFileExists()).toBe(false);
      });

      it('creates the file with the managed defaults', async () => {
        const run = await project.runSku('configure', ['workspace']);
        await expect(run).toMatchExitCode(0);
        expect(run.getStdallStr()).toContain('created pnpm-workspace.yaml');

        expect(await project.readWorkspaceFile()).toContain(
          'minimumReleaseAge: 4320 # 3 days [sku_managed]',
        );
      });

      it('passes --check once the file is aligned', async () => {
        const run = await project.runSku('configure', ['workspace', '--check']);
        await expect(run).toMatchExitCode(0);
      });

      it('fails --check on drift in a managed value, without writing', async () => {
        const drifted = (await project.readWorkspaceFile()).replace(
          'minimumReleaseAge: 4320 # 3 days [sku_managed]',
          'minimumReleaseAge: 1440 # [sku_managed]',
        );
        await project.writeWorkspaceFile(drifted);

        const run = await project.runSku('configure', ['workspace', '--check']);
        await expect(run).toMatchExitCode(1);

        const output = run.getStdallStr();
        expect(output).toContain(
          'pnpm-workspace.yaml: "minimumReleaseAge" has value 1440, recommended is 4320.',
        );
        // The subcommand suggests itself rather than the lint and format loop
        expect(output).toContain('sku configure workspace');
        expect(output).not.toContain('sku format');
        expect(await project.readWorkspaceFile()).toBe(drifted);
      });
    });

    it('no-ops in non-pnpm projects', async () => {
      await using fixture = await createProject({
        'package.json': packageJson({ packageManager: 'yarn@4.5.0' }),
        'yarn.lock': '',
      });

      const run = await sku('configure', ['workspace'], {
        cwd: cwdOf(fixture),
      });
      await expect(run).toMatchExitCode(0);

      expect(await fixture.exists(WORKSPACE_FILE)).toBe(false);
    });
  });

  describe('managedWorkspace: false', () => {
    const skuConfig = 'export default { managedWorkspace: false };\n';
    const workspaceYaml = yaml`
      packages:
        - .
      configDependencies:
        pnpm-plugin-sku: ^0.0.3
      minimumReleaseAge: 1440
    `;

    it('skips the lint check and the format sync, including plugin migration', async () => {
      await using fixture = await createProject(
        skuApp({ workspaceYaml, skuConfig }),
      );
      const cwd = cwdOf(fixture);

      // Lint passes despite the drift
      const lintRun = await sku('lint', [], { cwd });
      await expect(lintRun).toMatchExitCode(0);
      expect(lintRun.getStdallStr()).not.toContain('pnpm-plugin-sku');

      // Format writes nothing
      const formatRun = await sku('format', [], { cwd });
      await expect(formatRun).toMatchExitCode(0);
      expect(await fixture.readFile(WORKSPACE_FILE, 'utf8')).toBe(
        workspaceYaml,
      );
    });

    it('does not gate the configure workspace subcommand', async () => {
      await using fixture = await createProject(
        skuApp({ workspaceYaml, skuConfig }),
      );

      const run = await sku('configure', ['workspace'], {
        cwd: cwdOf(fixture),
      });
      await expect(run).toMatchExitCode(0);

      expect(await fixture.readFile(WORKSPACE_FILE, 'utf8')).toContain(
        'blockExoticSubdeps: true # [sku_managed]',
      );
    });
  });
});
