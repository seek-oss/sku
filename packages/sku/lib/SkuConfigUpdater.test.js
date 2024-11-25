/**
 * @jest-environment node
 */

// @ts-check
import { createFixture } from 'fs-fixture';
import dedent from 'dedent';
import { SkuConfigUpdater } from './SkuConfigUpdater';

describe('updateSkuConfig', () => {
  describe('SkuConfigUpdater', () => {
    it('Should update a TypeScript sku config with a literal ESM default export', async () => {
      const skuConfigFileName = 'sku.config.ts';

      const fixture = await createFixture({
        [skuConfigFileName]: dedent/* ts */ `
          export default {
            renderEntry: 'src/render.tsx',
            clientEntry: 'src/client.tsx',
          };`,
      });

      const modifier = await SkuConfigUpdater.fromFile(
        fixture.getPath(skuConfigFileName),
      );
      modifier.upsertConfig({
        property: 'renderEntry',
        value: 'src/updated-render.tsx',
      });
      modifier.upsertConfig({
        property: 'srcPaths',
        value: ['./src', './cypress'],
      });
      await modifier.commitConfig();

      const result = (await fixture.readFile(skuConfigFileName)).toString();
      expect(result).toMatchInlineSnapshot(`
        "export default {
          renderEntry: 'src/updated-render.tsx',
          clientEntry: 'src/client.tsx',
          srcPaths: ['./src', './cypress'],
        };
        "
      `);

      await fixture.rm();
    });

    it('Should update a TypeScript sku config with a literal ESM default export and "satisfies"', async () => {
      const skuConfigFileName = 'sku.config.ts';

      const fixture = await createFixture({
        [skuConfigFileName]: dedent/* ts */ `
          import type { SkuConfig } from 'sku';

          export default {
            renderEntry: 'src/render.tsx',
            clientEntry: 'src/client.tsx',
          } satisfies SkuConfig;`,
      });

      const modifier = await SkuConfigUpdater.fromFile(
        fixture.getPath(skuConfigFileName),
      );
      modifier.upsertConfig({
        property: 'renderEntry',
        value: 'src/updated-render.tsx',
      });
      modifier.upsertConfig({
        property: 'srcPaths',
        value: ['./src', './cypress'],
      });
      await modifier.commitConfig();

      const result = (await fixture.readFile(skuConfigFileName)).toString();
      expect(result).toMatchInlineSnapshot(`
        "import type { SkuConfig } from 'sku';

        export default {
          renderEntry: 'src/updated-render.tsx',
          clientEntry: 'src/client.tsx',
          srcPaths: ['./src', './cypress'],
        } satisfies SkuConfig;
        "
      `);

      await fixture.rm();
    });

    it('Should update a TypeScript sku config with a non-literal ESM default export', async () => {
      const skuConfigFileName = 'sku.config.ts';

      const fixture = await createFixture({
        [skuConfigFileName]: dedent/* ts */ `
          import type { SkuConfig } from 'sku';

          const skuConfig: SkuConfig = {
            renderEntry: 'src/render.tsx',
            clientEntry: 'src/client.tsx',
          };

          export default skuConfig;`,
      });

      const modifier = await SkuConfigUpdater.fromFile(
        fixture.getPath(skuConfigFileName),
      );
      modifier.upsertConfig({
        property: 'renderEntry',
        value: 'src/updated-render.tsx',
      });
      modifier.upsertConfig({
        property: 'srcPaths',
        value: ['./src', './cypress'],
      });
      await modifier.commitConfig();

      const result = (await fixture.readFile(skuConfigFileName)).toString();
      expect(result).toMatchInlineSnapshot(`
        "import type { SkuConfig } from 'sku';

        const skuConfig: SkuConfig = {
          renderEntry: 'src/updated-render.tsx',
          clientEntry: 'src/client.tsx',
          srcPaths: ['./src', './cypress'],
        };

        export default skuConfig;
        "
      `);

      await fixture.rm();
    });

    it('Should update a JavaScript sku config with a literal CJS default export', async () => {
      const skuConfigFileName = 'sku.config.ts';

      const fixture = await createFixture({
        [skuConfigFileName]: dedent/* ts */ `
          module.exports = {
            renderEntry: 'src/render.tsx',
            clientEntry: 'src/client.tsx',
          };`,
      });

      const modifier = await SkuConfigUpdater.fromFile(
        fixture.getPath(skuConfigFileName),
      );
      modifier.upsertConfig({
        property: 'renderEntry',
        value: 'src/updated-render.tsx',
      });
      modifier.upsertConfig({
        property: 'srcPaths',
        value: ['./src', './cypress'],
      });
      await modifier.commitConfig();

      const result = (await fixture.readFile(skuConfigFileName)).toString();
      expect(result).toMatchInlineSnapshot(`
        "module.exports = {
          renderEntry: 'src/updated-render.tsx',
          clientEntry: 'src/client.tsx',
          srcPaths: ['./src', './cypress'],
        };
        "
      `);

      await fixture.rm();
    });

    it('Should update a JavaScript sku config with a non-literal CJS default export', async () => {
      const skuConfigFileName = 'sku.config.ts';

      const fixture = await createFixture({
        [skuConfigFileName]: dedent/* ts */ `
          const skuConfig = {
            renderEntry: 'src/render.tsx',
            clientEntry: 'src/client.tsx',
          };

          module.exports = skuConfig;`,
      });

      const modifier = await SkuConfigUpdater.fromFile(
        fixture.getPath(skuConfigFileName),
      );
      modifier.upsertConfig({
        property: 'renderEntry',
        value: 'src/updated-render.tsx',
      });
      modifier.upsertConfig({
        property: 'srcPaths',
        value: ['./src', './cypress'],
      });
      await modifier.commitConfig();

      const result = (await fixture.readFile(skuConfigFileName)).toString();
      expect(result).toMatchInlineSnapshot(`
        "const skuConfig = {
          renderEntry: 'src/updated-render.tsx',
          clientEntry: 'src/client.tsx',
          srcPaths: ['./src', './cypress'],
        };

        module.exports = skuConfig;
        "
      `);

      await fixture.rm();
    });
  });
});
