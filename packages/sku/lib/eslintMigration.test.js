// @ts-check
import {
  migrateEslintignore,
  addEslintIgnoreToSkuConfig,
} from './eslintMigration.js';
import { createFixture } from 'fs-fixture';
import { default as dedent } from 'dedent';

describe('eslintMigration', () => {
  describe('migrateEslintignore', () => {
    it("should return a migrated eslint ignore config exluding any of sku's ignore entries or old ignore entries", async () => {
      const fixture = await createFixture({
        '.eslintignore': dedent`
          # managed by sku
          .eslintcache
          .prettierrc
          # no longer ignored by sku
          .eslintrc
          coverage/
          dist/
          report/
          tsconfig.json
          pnpm-lock.yaml
          # end managed by sku

          # custom user ignore
          src/graphql/types.ts

          # duplicate of a sku ignore
          pnpm-lock.yaml`,
      });

      const result = migrateEslintignore({
        eslintIgnorePath: fixture.getPath('.eslintignore'),
        hasLanguagesConfig: false,
        target: 'dist',
      });
      expect(result).toMatchInlineSnapshot(`
        [
          "src/graphql/types.ts",
        ]
      `);

      await fixture.rm();
    });

    it("should return the correct config when a 'languages' and a custom 'target' are configured", async () => {
      const fixture = await createFixture({
        '.eslintignore': dedent`
          # managed by sku
          **/*.vocab/index.ts
          .eslintcache
          .prettierrc
          coverage/
          dist/foo/
          report/
          tsconfig.json
          pnpm-lock.yaml
          # end managed by sku
          `,
      });

      const result = migrateEslintignore({
        eslintIgnorePath: fixture.getPath('.eslintignore'),
        hasLanguagesConfig: true,
        target: 'dist/foo',
      });
      expect(result).toMatchInlineSnapshot(`[]`);

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
