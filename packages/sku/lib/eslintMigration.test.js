const {
  migrateEslintignore,
  addEslintIgnoreToSkuConfig,
} = require('./eslintMigration');
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
        [
          "src/graphql/types.ts",
        ]
      `);

      await fixture.rm();
    });
  });

  describe('addEslintIgnoreToSkuConfig', () => {
    it("should add 'eslintIgnore' to a sku config", async () => {
      const eslintIgnore = ['**/foo', 'src/types/graphql.ts'];
      const skuConfigFileName = 'sku.config.ts';

      const fixture = await createFixture({
        [skuConfigFileName]: dedent`
          export default {
            clientEntry: 'src/client.ts',
            renderEntry: 'src/render.ts',
          };`,
      });

      await addEslintIgnoreToSkuConfig({
        skuConfigPath: fixture.getPath(skuConfigFileName),
        eslintIgnore,
      });
      const result = (await fixture.readFile(skuConfigFileName)).toString();

      expect(result).toMatchInlineSnapshot(`
        "export default {
          clientEntry: 'src/client.ts',
          renderEntry: 'src/render.ts',

          eslintIgnore: ['**/foo', 'src/types/graphql.ts'],
        };
        "
      `);

      await fixture.rm();
    });
  });
});
