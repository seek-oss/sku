import { transform as mockTypes } from './jest-to-vitest-mock-types.js';
import { transform as jestMethods } from './jest-to-vitest-jest-methods.js';
import { transform as fnGenerics } from './jest-to-vitest-fn-generics.js';
import { transform as setTimeout } from './jest-to-vitest-set-timeout.js';
import { transform as mockFactories } from './jest-to-vitest-mock-factories.js';
import { transform as hooks } from './jest-to-vitest-hooks.js';
import { transform as failing } from './jest-to-vitest-failing.js';
import { transform as resolvesRejectsGenerics } from './jest-to-vitest-resolves-rejects-generics.js';
import { transform as imports } from './jest-to-vitest-imports.js';
import type { Transform } from '../utils/types.js';

const steps: Transform[] = [
  mockTypes,
  jestMethods,
  fnGenerics,
  setTimeout,
  mockFactories,
  hooks,
  failing,
  resolvesRejectsGenerics,
  imports,
];

/**
 * Full Jest → Vitest migration pipeline. Runs each step in canonical order,
 * passing the output of each step as the input to the next.
 *
 * Individual steps are also exported as standalone codemods for granular use.
 */
export const transform: Transform = async (source) => {
  let current = source;
  for (const step of steps) {
    const next = await step(current);
    if (next !== null) {
      current = next;
    }
  }
  return current === source ? null : current;
};
