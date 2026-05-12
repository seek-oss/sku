import ts from 'dedent';
import { runCodemodTests } from '@sku-private/testing-library/codemod';

runCodemodTests('jest-to-vitest-fn-generics', [
  {
    filename: 'jest-fn-with-generics.test.ts',
    input: ts /* ts */ `
      type Middleware = (req: Request, res: Response) => void;

      const middleware = jest.fn<void, Parameters<Middleware>>();
      const callback = jest.fn<string, [number, boolean]>();
      const handler = jest.fn<Promise<void>, [Context]>();
      export const resolveRoles = jest.fn<
        Promise<string[]> | string[],
        [ApolloContext]
      >();
    `,
    output: ts /* ts */ `
      type Middleware = (req: Request, res: Response) => void;

      const middleware = vi.fn<(...args: Parameters<Middleware>) => void>();
      const callback = vi.fn<(...args: [number, boolean]) => string>();
      const handler = vi.fn<(...args: [Context]) => Promise<void>>();
      export const resolveRoles = vi.fn<(...args: [ApolloContext]) => Promise<string[]> | string[]>();
    `,
  },
]);
