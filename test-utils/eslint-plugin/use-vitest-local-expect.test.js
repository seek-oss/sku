import { RuleTester } from 'eslint';
import useVitestLocalExpect from './use-vitest-local-expect.cjs';

const ruleTester = new RuleTester({
  // Must use at least ecmaVersion 2015 because
  // that's when `const` variables were introduced.
  languageOptions: { ecmaVersion: 2022 },
});

// Throws error if the tests in ruleTester.run() do not pass
ruleTester.run(
  'use-vitest-local-expect', // rule name
  useVitestLocalExpect, // rule code
  {
    // checks
    // 'valid' checks cases that should pass
    valid: [
      {
        code: "it('should do something', ({expect}) => { expect(true).toBe(true); });",
      },
    ],
    // 'invalid' checks cases that should not pass
    invalid: [
      {
        code: "it('should do something', () => { expect(true).toBe(true); });",
        output:
          "it('should do something', ({expect}) => { expect(true).toBe(true); });",
        errors: 1,
      },
      {
        code: `it('should do something',
        async () => { await expect(true).toBe(true); });`,
        output: `it('should do something',
        async ({expect}) => { await expect(true).toBe(true); });`,
        errors: 1,
      },
      {
        code: "it('should do something', ({coo}) => { expect(true).toBe(true); });",
        output:
          "it('should do something', ({coo, expect}) => { expect(true).toBe(true); });",
        errors: 1,
      },

      {
        code: `import { it, expect } from 'vitest';

        it('should do something', ({coo}) => { expect(true).toBe(true); });`,
        output: `import { it } from 'vitest';

        it('should do something', ({coo, expect}) => { expect(true).toBe(true); });`,
        errors: 2,
      },
    ],
  },
);

console.log('Vitest local expect rule tests completed successfully.');
