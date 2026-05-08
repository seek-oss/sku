import { describe, it, expect, afterEach } from 'vitest';
import { render } from 'cli-testing-library';
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import os from 'node:os';
import { join } from 'node:path';
import ts from 'dedent';

const require = createRequire(import.meta.url);
const codemodBin = require.resolve('../../../packages/codemod/bin.js');

const renderInteractive = (cwd: string) => render(codemodBin, [], { cwd });

const tmpDirs: string[] = [];

const makeTmpDir = async (files: Record<string, string>) => {
  const dir = await fs.mkdtemp(join(os.tmpdir(), 'codemod-interactive-'));
  tmpDirs.push(dir);
  await Promise.all(
    Object.entries(files).map(([name, content]) =>
      fs.writeFile(join(dir, name), content),
    ),
  );
  return {
    path: dir,
    getPath: (name: string) => join(dir, name),
  };
};

afterEach(async () => {
  await Promise.all(
    tmpDirs.splice(0).map((d) => fs.rm(d, { recursive: true, force: true })),
  );
});

describe('interactive CLI', () => {
  it('runs a non-jest codemod', async () => {
    const fixture = await makeTmpDir({
      'file.ts': ts`
        import logo from './logo.svg';
      `,
    });

    const { findByText, userEvent } = await renderInteractive(fixture.path);

    await findByText('Which transform would you like to apply?');
    // svg-import-query-param is the 3rd option: two ArrowDowns
    userEvent.keyboard('[ArrowDown][ArrowDown][Enter]');

    // Path prompt appears immediately — no sub-select for non-jest codemods
    await findByText('Which directory should the codemods run on?');
    userEvent.keyboard('[Enter]');

    // Toggle dry-run confirm to No so files are written
    await findByText('Dry run (do not write changes to disk)?');
    userEvent.keyboard('[ArrowRight][Enter]');

    await findByText('Changed files');

    const result = await fs.readFile(fixture.getPath('file.ts'), 'utf-8');
    expect(result).toContain("'./logo.svg?raw'");
  });

  it('runs the full jest-to-vitest pipeline', async () => {
    const fixture = await makeTmpDir({
      'file.test.ts': ts`
        const foo = jest.fn();
        beforeAll(() => {});
      `,
    });

    const { findByText, userEvent } = await renderInteractive(fixture.path);

    await findByText('Which transform would you like to apply?');
    // jest-to-vitest is the 2nd option: one ArrowDown
    userEvent.keyboard('[ArrowDown][Enter]');

    // Select the full pipeline (default, first option)
    await findByText('Jest → Vitest migration');
    userEvent.keyboard('[Enter]');

    await findByText('Which directory should the codemods run on?');
    userEvent.keyboard('[Enter]');

    await findByText('Dry run (do not write changes to disk)?');
    userEvent.keyboard('[ArrowRight][Enter]');

    await findByText('Changed files');

    const result = await fs.readFile(fixture.getPath('file.test.ts'), 'utf-8');
    expect(result).toContain('vi.fn()');
    expect(result).toContain("import { beforeAll, vi } from 'vitest'");
  });

  it('applies only selected steps in order', async () => {
    // We select only jest-methods. The mock-types cast should stay unchanged.
    const fixture = await makeTmpDir({
      'file.test.ts': ts`
        const foo = jest.fn();
        const bar = foo as jest.Mock;
      `,
    });

    const { findByText, userEvent } = await renderInteractive(fixture.path);

    await findByText('Which transform would you like to apply?');
    userEvent.keyboard('[ArrowDown][Enter]'); // jest-to-vitest

    await findByText('Jest → Vitest migration');
    userEvent.keyboard('[ArrowDown][Enter]'); // Choose specific steps

    await findByText('Select steps');
    await findByText('mock-types'); // short label for jest-to-vitest-mock-types
    await findByText('hooks'); // short label for jest-to-vitest-hooks

    // jest-methods, Space to select, Enter to confirm.
    userEvent.keyboard('[ArrowDown][Space][Enter]');

    await findByText('Which directory should the codemods run on?');
    userEvent.keyboard('[Enter]');

    await findByText('Dry run (do not write changes to disk)?');
    userEvent.keyboard('[ArrowRight][Enter]');

    await findByText('Changed files');

    const result = await fs.readFile(fixture.getPath('file.test.ts'), 'utf-8');
    // jest-methods applied: jest.fn() → vi.fn()
    expect(result).toContain('vi.fn()');
    // imports auto-appended: import { vi } from 'vitest'
    expect(result).toContain("import { vi } from 'vitest'");
    // mock-types NOT selected: the `as jest.Mock` cast is unchanged
    expect(result).toContain('as jest.Mock');
  });
});
