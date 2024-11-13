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
        {
          "ignores": [
            "src/graphql/types.ts",
          ],
        }
      `);

      await fixture.rm();
    });
  });

  describe('addEslintIgnoreToSkuConfig', () => {
    const eslintIgnore = ['**/foo', 'src/types/graphql.ts'];

    it("should add 'eslintIgnore' to a javascript sku config with a literal ESM default export", async () => {
      const skuConfigFileName = 'sku.config.js';

      const fixture = await createFixture({
        [skuConfigFileName]: dedent`
          export default {
            clientEntry: 'src/client.js',
            renderEntry: 'src/render.js',
          };`,
      });

      await addEslintIgnoreToSkuConfig({
        skuConfigPath: fixture.getPath(skuConfigFileName),
        eslintIgnore,
      });
      const result = (await fixture.readFile(skuConfigFileName)).toString();

      expect(result).toMatchInlineSnapshot(`
        "export default {
          clientEntry: 'src/client.js',
          renderEntry: 'src/render.js',

          eslintIgnore: ['**/foo', 'src/types/graphql.ts'],
        };
        "
      `);

      await fixture.rm();
    });

    it("should add 'eslintIgnore' to a javascript sku config with a non-literal ESM default export", async () => {
      const skuConfigFileName = 'sku.config.js';

      const fixture = await createFixture({
        [skuConfigFileName]: dedent`
          const skuConfig = {
            clientEntry: 'src/client.js',
            renderEntry: 'src/render.js',
          }
          export default skuConfig;`,
      });

      await addEslintIgnoreToSkuConfig({
        skuConfigPath: fixture.getPath(skuConfigFileName),
        eslintIgnore,
      });
      const result = (await fixture.readFile(skuConfigFileName)).toString();

      expect(result).toMatchInlineSnapshot(`
        "const skuConfig = {
          clientEntry: 'src/client.js',
          renderEntry: 'src/render.js',
          eslintIgnore: ['**/foo', 'src/types/graphql.ts'],
        };
        export default skuConfig;
        "
      `);

      await fixture.rm();
    });

    it("should add 'eslintIgnore' to a javascript sku config with a literal CJS default export", async () => {
      const skuConfigFileName = 'sku.config.js';

      const fixture = await createFixture({
        [skuConfigFileName]: dedent`
          module.exports = {
            clientEntry: 'src/client.js',
            renderEntry: 'src/render.js',
          };`,
      });

      await addEslintIgnoreToSkuConfig({
        skuConfigPath: fixture.getPath(skuConfigFileName),
        eslintIgnore,
      });
      const result = (await fixture.readFile(skuConfigFileName)).toString();

      expect(result).toMatchInlineSnapshot(`
        "module.exports = {
          clientEntry: 'src/client.js',
          renderEntry: 'src/render.js',

          eslintIgnore: ['**/foo', 'src/types/graphql.ts'],
        };
        "
      `);

      await fixture.rm();
    });

    it("should add 'eslintIgnore' to a javascript sku config with a non-literal CJS default export", async () => {
      const skuConfigFileName = 'sku.config.js';

      const fixture = await createFixture({
        [skuConfigFileName]: dedent`
          const skuConfig = {
            clientEntry: 'src/client.js',
            renderEntry: 'src/render.js',
          };
          module.exports = skuConfig;`,
      });

      await addEslintIgnoreToSkuConfig({
        skuConfigPath: fixture.getPath(skuConfigFileName),
        eslintIgnore,
      });
      const result = (await fixture.readFile(skuConfigFileName)).toString();

      expect(result).toMatchInlineSnapshot(`
        "const skuConfig = {
          clientEntry: 'src/client.js',
          renderEntry: 'src/render.js',
          eslintIgnore: ['**/foo', 'src/types/graphql.ts'],
        };
        module.exports = skuConfig;"
      `);

      await fixture.rm();
    });

    it("should add 'eslintIgnore' to a typescript sku config with a literal ESM default export that uses 'satisfies'", async () => {
      const skuConfigFileName = 'sku.config.ts';

      const fixture = await createFixture({
        [skuConfigFileName]: dedent`
          import type { SkuConfig } from 'sku';

          export default {
            clientEntry: 'src/client.js',
            renderEntry: 'src/render.js',
          } satisfies SkuConfig;`,
      });

      await addEslintIgnoreToSkuConfig({
        skuConfigPath: fixture.getPath(skuConfigFileName),
        eslintIgnore,
      });
      const result = (await fixture.readFile(skuConfigFileName)).toString();

      expect(result).toMatchInlineSnapshot(`
        "import type { SkuConfig } from 'sku';

        export default {
          clientEntry: 'src/client.js',
          renderEntry: 'src/render.js',
          eslintIgnore: ['**/foo', 'src/types/graphql.ts'],
        } satisfies SkuConfig;
        "
      `);

      await fixture.rm();
    });
  });
});
