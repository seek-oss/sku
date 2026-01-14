import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import fs from 'node:fs/promises';
import { scopeToFixture } from '@sku-private/testing-library';

const { sku, fixturePath } = scopeToFixture('sort-package-json');

describe('sort-package-json', () => {
  describe('sku lint', () => {
    it('should catch type errors', async () => {
      const lint = await sku('lint');
      expect(await lint.findByText('Linting complete')).toBeInTheConsole();
      expect(
        lint.getByText('package.json is not sorted correctly'),
      ).toBeInTheConsole();
      expect(
        lint.getByText(
          '0 errors and 2 warnings potentially fixable with the `--fix` option.',
        ),
      ).toBeInTheConsole();
    });
  });

  describe('sku format', () => {
    beforeEach(async () => {
      await fs.copyFile(
        fixturePath('package.json'),
        fixturePath('original-package.json'),
      );
      await fs.copyFile(
        fixturePath('src/apps/nested/package.json'),
        fixturePath('src/apps/nested/original-package.json'),
      );
    });

    afterEach(async () => {
      await fs.rename(
        fixturePath('original-package.json'),
        fixturePath('package.json'),
      );
      await fs.rename(
        fixturePath('src/apps/nested/original-package.json'),
        fixturePath('src/apps/nested/package.json'),
      );
    });

    expect.addSnapshotSerializer({
      serialize: (val) => val,
      test: (val) => typeof val === 'string',
    });

    it('should sort package.json', async () => {
      const format = await sku('format');
      expect(await format.findByText('Formatting complete')).toBeInTheConsole();

      const packageJson = await fs.readFile(fixturePath('package.json'), {
        encoding: 'utf-8',
      });
      const nestedPackageJson = await fs.readFile(
        fixturePath('src/apps/nested/package.json'),
        {
          encoding: 'utf-8',
        },
      );

      expect(packageJson).toMatchSnapshot();
      expect(nestedPackageJson).toMatchSnapshot();
    });
  });
});
