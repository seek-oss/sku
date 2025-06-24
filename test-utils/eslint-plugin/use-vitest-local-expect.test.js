import useVitestLocalExpect from './use-vitest-local-expect.cjs';

import { createRuleTester } from 'eslint-vitest-rule-tester';
import { describe, it } from 'vitest';

describe('use-vitest-local-expect', () => {
  const { valid, invalid } = createRuleTester({
    name: 'use-vitest-local-expect',
    rule: useVitestLocalExpect,
    configs: {
      // flat config options
      languageOptions: {
        parserOptions: {
          ecmaVersion: 2020,
          sourceType: 'module',
        },
      },
    },
  });

  it('valid case', () => {
    valid(
      "it('should do something', ({expect}) => { expect(true).toBe(true); });",
    );
  });

  it('invalid case: no expect accessed from context', async ({ expect }) => {
    const { result } = await invalid({
      code: "it('should do something', () => { expect(true).toBe(true); });",
      errors: ['correctExpect'],
    });

    expect(result.output).toMatchInlineSnapshot(
      `"it('should do something', ({expect}) => { expect(true).toBe(true); });"`,
    );
  });

  it('invalid case: async no expect accessed from context', async ({
    expect,
  }) => {
    const { result } = await invalid({
      code: `it('should do something', async () => { await expect(true).toBe(true); });`,
      errors: ['correctExpect'],
    });

    expect(result.output).toMatchInlineSnapshot(
      `"it('should do something', async ({expect}) => { await expect(true).toBe(true); });"`,
    );
  });

  it('invalid case: no expect but context provided', async ({ expect }) => {
    const { result } = await invalid({
      code: "it('should do something', ({coo}) => { expect(true).toBe(true); });",
      errors: ['correctExpect'],
    });

    expect(result.output).toMatchInlineSnapshot(
      `"it('should do something', ({coo, expect}) => { expect(true).toBe(true); });"`,
    );
  });

  it('invalid case: expect imported', async ({ expect }) => {
    const { result } = await invalid({
      code: `import { it, expect } from 'vitest';

         it('should do something', ({coo}) => { expect(true).toBe(true); });`,
      errors: ['removeImport', 'correctExpect'],
    });

    expect(result.output).toMatchInlineSnapshot(`
      "import { it } from 'vitest';

               it('should do something', ({coo, expect}) => { expect(true).toBe(true); });"
    `);
  });

  it('invalid case: renamed expect imported', async ({ expect }) => {
    const { result } = await invalid({
      code: `import { it, expect as globalExpect } from 'vitest';

         it('should do something', ({coo}) => { expect(true).toBe(true); });`,
      errors: ['correctExpect'],
    });

    expect(result.output).toMatchInlineSnapshot(`
      "import { it, expect as globalExpect } from 'vitest';

               it('should do something', ({coo, expect}) => { expect(true).toBe(true); });"
    `);
  });

  it('invalid case: expect imported with renamed extra properties', async ({
    expect,
  }) => {
    const { result } = await invalid({
      code: `import { it, expect, vi as globalVi } from 'vitest';

         it('should do something', ({coo}) => { expect(true).toBe(true); });`,
      errors: ['removeImport', 'correctExpect'],
    });

    expect(result.output).toMatchInlineSnapshot(`
      "import { it, vi as globalVi } from 'vitest';

               it('should do something', ({coo, expect}) => { expect(true).toBe(true); });"
    `);
  });
});
