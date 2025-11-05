import { parseAsync, Lang, type Edit } from '@ast-grep/napi';

const testGlobals = ['describe', 'it', 'test'];
const jestGlobals = [
  'expect',
  'beforeAll',
  'beforeEach',
  'afterAll',
  'afterEach',
  ...testGlobals,
];

const serializeImports = (imports: Set<string>) =>
  Array.from(imports).sort().join(', ');

export const transform = async (source: string) => {
  const ast = await parseAsync(Lang.Tsx, source);
  const root = ast.root();

  const edits: Edit[] = [];
  const vitestImports = new Set<string>();

  // Replace `jest.<method>` with `vi.<method>`

  const jestMethods = root.findAll({
    // Matches `jest.<method>` except `jest.requireActual` as that is handled separately
    rule: {
      pattern: 'jest.$METHOD',
      kind: 'member_expression',
      not: {
        pattern: 'jest.requireActual',
      },
    },
  });

  for (const node of jestMethods) {
    const methodArg = node.getMatch('METHOD')?.text();

    if (methodArg) {
      edits.push(node.replace(`vi.${methodArg}`));
    }
  }

  if (jestMethods.length > 0) {
    vitestImports.add('vi');
  }

  const jestMockFactoryParameters = root.findAll({
    // Find all mock factories that contain `jest.requireActual` and are not already async
    rule: {
      // Matching only the parameters of the function so that we can edit deeply nested functions.
      // Matching on `arrow_function` and `function_expression` _would_ match deeply nested functions, but
      // editing will fail since the top-level function will have been edited already, breaking child edits.
      kind: 'formal_parameters',
      inside: {
        not: { pattern: 'async $$$' },
        has: {
          pattern: 'jest.requireActual',
          kind: 'member_expression',
          stopBy: 'end',
        },
      },
    },
  });

  // Add "async" to mock factory parameters
  for (const node of jestMockFactoryParameters) {
    const parent = node.parent();
    // Since we are matching on the parameters of the function we need to check
    // if the parent is a function expression (`function () {}`) so that we add `async` to the right place.
    const nodeToEdit = parent?.is('function_expression') ? parent : node;

    const {
      start: { index },
    } = nodeToEdit.range();

    const edit: Edit = {
      startPos: index,
      endPos: index,
      insertedText: 'async ',
    };

    edits.push(edit);
  }

  // Replace `jest.requireActual` with `await vi.importActual`
  const requireActualNodes = root.findAll({
    rule: {
      pattern: 'jest.requireActual',
      kind: 'member_expression',
    },
  });

  for (const node of requireActualNodes) {
    const edit = node.replace('await vi.importActual');
    edits.push(edit);
  }

  // Track usage of Jest globals and import them from `vitest`

  const foundJestGlobals = root.findAll({
    // Matches globals like `beforeAll()`, describe()`, `it()`, etc.
    // Also matches `test.only`, `it.skip.each`, etc.
    rule: {
      any: [
        ...jestGlobals.map((global) => ({
          pattern: global,
          kind: 'call_expression > identifier',
        })),
        ...testGlobals.map((global) => ({
          pattern: global,
          kind: 'call_expression member_expression > identifier',
        })),
      ],
    },
  });

  for (const node of foundJestGlobals) {
    const t = node.text();
    vitestImports.add(t);
  }

  const foundJestMockTypes = root.findAll({
    rule: {
      kind: 'as_expression',
      any: [
        { pattern: '$IDENTIFIER as jest.Mock' },
        { pattern: '$IDENTIFIER as jest.Mock<$$$_GENERIC_ARGS>' },
        { pattern: '$IDENTIFIER as jest.MockedFunction' },
        { pattern: '$IDENTIFIER as jest.MockedFunction<$$$_GENERIC_ARGS>' },
        {
          pattern:
            '$IDENTIFIER as jest.MockedFunction<$$$_GENERIC_ARGS> & $_OBJECT_TYPE',
        },
      ],
    },
  });

  for (const node of foundJestMockTypes) {
    const identifier = node.getMatch('IDENTIFIER')?.text();
    if (identifier) {
      const edit = node.replace(`vi.mocked(${identifier})`);
      edits.push(edit);
    }
  }

  if (foundJestMockTypes.length > 0) {
    vitestImports.add('vi');
  }

  const foundFailingTests = root.findAll({
    rule: {
      pattern: {
        selector: 'property_identifier',
        context: '$_OBJ.failing',
      },
    },
  });

  for (const node of foundFailingTests) {
    const edit = node.replace('fails');
    edits.push(edit);
  }

  // Replace generics in expect chains with satisfies operator
  // This handles patterns like:
  // - expect(result).resolves.toEqual<MyType>({}) -> expect(result).resolves.toEqual({} satisfies MyType)
  // - expect(result).not.toBe<Foo>("test") -> expect(result).not.toBe("test" satisfies Foo)
  // - expect(result).rejects.toThrow<ErrorType>() -> expect(result).rejects.toThrow({} satisfies ErrorType)

  // Use a simpler approach: find all call expressions with type arguments that contain "expect"
  const expectChainGenerics = root.findAll({
    rule: {
      kind: 'call_expression',
      has: {
        kind: 'type_arguments',
      },
    },
  });

  for (const node of expectChainGenerics) {
    const fullText = node.text();

    // Only process nodes that contain expect calls
    if (!fullText.includes('expect(')) {
      continue;
    }

    // Check if this is an expect chain by looking at the member expression
    const memberExpr = node.field('function');
    if (!memberExpr) {
      continue;
    }

    const memberText = memberExpr.text();
    if (!memberText.includes('expect(') && !memberText.includes('expect.')) {
      continue;
    }

    // Find type arguments
    const typeArgs = node.find({
      rule: {
        kind: 'type_arguments',
      },
    });

    if (!typeArgs) {
      continue;
    }

    // Extract the generic type (without < >)
    const genericText = typeArgs.text();
    const generic = genericText.slice(1, -1);

    // Get arguments
    const argsNode = node.field('arguments');
    if (!argsNode) {
      continue;
    }

    const argsText = argsNode.text();
    const args = argsText.slice(1, -1).trim(); // Remove ( and )

    // Build replacement
    const beforeTypeArgs = fullText.substring(0, fullText.indexOf('<'));
    const afterArgs = fullText.substring(fullText.lastIndexOf(')') + 1);

    let replacement: string;

    if (args && args.trim() !== '') {
      // Simple argument parsing - for complex cases, just append satisfies to first arg
      const firstComma = args.indexOf(',');

      if (firstComma === -1) {
        // Single argument
        replacement = `${beforeTypeArgs}(${args} satisfies ${generic})${afterArgs}`;
      } else {
        // Multiple arguments - add satisfies to the first one
        const firstArg = args.substring(0, firstComma).trim();
        const restArgs = args.substring(firstComma);
        replacement = `${beforeTypeArgs}(${firstArg} satisfies ${generic}${restArgs})${afterArgs}`;
      }
    } else {
      // No arguments - skip transformation for empty calls like .toThrow<Error>()
      // These should remain as is since there's nothing to apply satisfies to
      continue;
    }

    const edit = node.replace(replacement);
    edits.push(edit);
  }

  if (vitestImports.size === 0) {
    return root.commitEdits(edits);
  }

  const existingVitestImports = root.findAll({
    rule: {
      kind: 'import_specifier',
      inside: {
        kind: 'import_statement',
        stopBy: 'end',
        has: {
          kind: 'string',
          regex: 'vitest',
        },
        not: {
          pattern: 'import type',
        },
      },
    },
  });

  if (existingVitestImports.length === 0) {
    const result = root.commitEdits(edits);
    const serializedImports = serializeImports(vitestImports);

    // Unsure why, but committing an edit for the vitest import causes a runtime panic, so we
    // commit existing edits and then prepend the import manually
    return `import { ${serializedImports} } from 'vitest';\n${result}`;
  }

  for (const node of existingVitestImports) {
    // This doesn't handle aliased imports, but that's a very niche case and adds complexity
    vitestImports.add(node.text());
  }

  const serializedImports = serializeImports(vitestImports);
  const namedImportsList = existingVitestImports[0].parent();
  if (namedImportsList) {
    const edit = namedImportsList?.replace(`{ ${serializedImports} }`);
    edits.push(edit);
  }

  return root.commitEdits(edits);
};
