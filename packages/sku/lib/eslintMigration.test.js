const { migrateEslintignore } = require('./eslintMigration');
const { createFixture } = require('fs-fixture');
const dedent = require('dedent');

describe('eslintMigration', () => {
  describe('migrateEslintignore', () => {
    it("should return a migrated eslint ignore config exluding any of sku's ignore entries", async () => {
      const fixture = await createFixture({
        '.eslintignore': dedent`
          src/graphql/types.ts

          # managed by sku
          .eslintcache
          .eslintrc
          .prettierrc
          coverage/
          dist/
          report/
          tsconfig.json
          pnpm-lock.yaml
          # end managed by sku

          pnpm-lock.yaml`,
      });

      const result = migrateEslintignore(fixture.getPath('.eslintignore'));

      expect(result).toMatchInlineSnapshot(`
        {
          "ignores": [
            "src/graphql/types.ts",
          ],
        }
      `);

      await fixture.rm();
    });
  });
});
