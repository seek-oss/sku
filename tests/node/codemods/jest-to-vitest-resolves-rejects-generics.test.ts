import ts from 'dedent';
import { runCodemodTests } from '@sku-private/testing-library/codemod';

runCodemodTests('jest-to-vitest-resolves-rejects-generics', [
  {
    filename: 'genericExpects.test.ts',
    input: ts /* ts */ `
        interface MyType {
          id: number;
          name: string;
        }

        it('should handle generic expects', async () => {
          const result = Promise.resolve({ id: 1, name: 'test' });
          const error = new Error('test error');
          const stringValue = 'hello';
          const numberValue = 42;
          const objectValue = { key: 'value' };

          // Generic with resolves/rejects and objects (should be transformed)
          expect(result).resolves.toEqual<MyType>({});
          expect(result).resolves.toMatchObject<MyType>({ id: 1 });
          await expect(result).resolves.toStrictEqual<MyType>({ id: 1, name: 'test' });

          // Generic with longer chains including .not (should be transformed)
          expect(result).not.resolves.toEqual<MyType>({});
          expect(result).not.resolves.toMatchObject<MyType>({ id: 1 });
          expect(promise).not.rejects.toThrow<Error>(error);
          expect(result).resolves.not.toEqual<MyType>(wrongData);
          expect(promise).rejects.not.toBe<string>('error');

          // Generic with complex types (should be transformed)
          expect(rejectedPromise).rejects.toMatchObject<{ error: string }>({ error: 'failed' });
          expect(rejectedPromise).rejects.toMatchObject<{ error: string, status: number }>({ error: 'failed', status: 500 });
          await expect(complexAsyncCall()).resolves.toStrictEqual<ComplexObject>({
            prop1: 'value1',
            nested: {
              prop2: 'value2',
              items: ['item1'],
            },
            prop3: expect.any(Object),
          });

          // Generic with regular expect chains (should remain unchanged)
          expect(stringValue).toBe<string>('hello');
          expect(numberValue).toEqual<number>(42);
          expect(objectValue).toMatchObject<{ key: string }>({ key: 'value' });

          // Generic with .not chains (should remain unchanged)
          expect(stringValue).not.toBe<string>('world');
          expect(numberValue).not.toEqual<number>(0);

          // Generic with variables and complex expressions (should remain unchanged)
          expect(getValue()).toEqual<MyType>(expectedValue);
          expect(processData(input)).toBe<string>(result.output);
        });
      `,
    output: ts /* ts */ `
        interface MyType {
          id: number;
          name: string;
        }

        it('should handle generic expects', async () => {
          const result = Promise.resolve({ id: 1, name: 'test' });
          const error = new Error('test error');
          const stringValue = 'hello';
          const numberValue = 42;
          const objectValue = { key: 'value' };

          // Generic with resolves/rejects and objects (should be transformed)
          expect(result).resolves.toEqual({} satisfies MyType);
          expect(result).resolves.toMatchObject({ id: 1 } satisfies MyType);
          await expect(result).resolves.toStrictEqual({ id: 1, name: 'test' } satisfies MyType);

          // Generic with longer chains including .not (should be transformed)
          expect(result).not.resolves.toEqual({} satisfies MyType);
          expect(result).not.resolves.toMatchObject({ id: 1 } satisfies MyType);
          expect(promise).not.rejects.toThrow(error satisfies Error);
          expect(result).resolves.not.toEqual(wrongData satisfies MyType);
          expect(promise).rejects.not.toBe('error' satisfies string);

          // Generic with complex types (should be transformed)
          expect(rejectedPromise).rejects.toMatchObject({ error: 'failed' } satisfies { error: string });
          expect(rejectedPromise).rejects.toMatchObject({ error: 'failed', status: 500 } satisfies { error: string, status: number });
          await expect(complexAsyncCall()).resolves.toStrictEqual({
            prop1: 'value1',
            nested: {
              prop2: 'value2',
              items: ['item1'],
            },
            prop3: expect.any(Object),
          } satisfies ComplexObject);

          // Generic with regular expect chains (should remain unchanged)
          expect(stringValue).toBe<string>('hello');
          expect(numberValue).toEqual<number>(42);
          expect(objectValue).toMatchObject<{ key: string }>({ key: 'value' });

          // Generic with .not chains (should remain unchanged)
          expect(stringValue).not.toBe<string>('world');
          expect(numberValue).not.toEqual<number>(0);

          // Generic with variables and complex expressions (should remain unchanged)
          expect(getValue()).toEqual<MyType>(expectedValue);
          expect(processData(input)).toBe<string>(result.output);
        });
      `,
  },
]);
