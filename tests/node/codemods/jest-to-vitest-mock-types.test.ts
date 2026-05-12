import ts from 'dedent';
import { runCodemodTests } from '@sku-private/testing-library/codemod';

runCodemodTests('jest-to-vitest-mock-types', [
  {
    filename: 'mockedFooCasts.test.ts',
    input: ts /* ts */ `
      const foo = vi.fn();

      const mockedFoo = foo as jest.Mock;
      const mockedFoo = foo as jest.Mock<any>;
      const mockedFoo = foo as jest.Mock<any, any, any>;
      const mockedFoo = foo as jest.MockedFunction;
      const mockedFoo = foo as jest.MockedFunction<typeof foo>;
      const mockedFoo = foo as jest.MockedFunction<typeof foo> & { otherProperty: any };
    `,
    output: ts /* ts */ `
      const foo = vi.fn();

      const mockedFoo = vi.mocked(foo);
      const mockedFoo = vi.mocked(foo);
      const mockedFoo = vi.mocked(foo);
      const mockedFoo = vi.mocked(foo);
      const mockedFoo = vi.mocked(foo);
      const mockedFoo = vi.mocked(foo);
    `,
  },
]);
