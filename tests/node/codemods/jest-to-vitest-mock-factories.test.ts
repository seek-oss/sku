import ts from 'dedent';
import { runCodemodTests } from '@sku-private/testing-library/codemod';

runCodemodTests('jest-to-vitest', 'jest-to-vitest mock-factories', [
  {
    filename: 'mock-defined-outside.test.ts',
    input: ts /* ts */ `
      import { test, vi } from 'vitest';
      const mock = () => ({
        ...jest.requireActual('./foo2'),
        ...jest.requireActual('./foo3'),
        foo: 'foo',
        bar: jest.fn(),
        baz: () => {
          return 'baz';
        },
        qux: async () => {
          return 'qux';
        },
        wert: function () {
          return 'wert';
        },
        pulp: async function () {
          return 'pulp';
        },
        blorp: () => {
          return jest.requireActual();
        },
        beep: function importMock() {
          return jest.requireActual();
        },
      });

      jest.mock('./foo2', mock);
    `,
    output: ts /* ts */ `
    import { test, vi } from 'vitest';
    const mock = async () => ({
      ...await vi.importActual('./foo2'),
      ...await vi.importActual('./foo3'),
      foo: 'foo',
      bar: vi.fn(),
      baz: () => {
        return 'baz';
      },
      qux: async () => {
        return 'qux';
      },
      wert: function () {
        return 'wert';
      },
      pulp: async function () {
        return 'pulp';
      },
      blorp: async () => {
        return await vi.importActual();
      },
      beep: async function importMock() {
        return await vi.importActual();
      },
    });

    vi.mock('./foo2', mock);
    `,
  },
]);
