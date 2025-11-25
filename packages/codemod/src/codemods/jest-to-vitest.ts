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
    // Matches `jest.<method>` except `jest.requireActual`, `jest.setTimeout`, and `jest.fn<...>` as those are handled separately
    rule: {
      pattern: 'jest.$METHOD',
      kind: 'member_expression',
      not: {
        any: [
          { pattern: 'jest.requireActual' },
          { pattern: 'jest.setTimeout' },
          {
            pattern: 'jest.fn',
            inside: {
              kind: 'call_expression',
              has: {
                kind: 'type_arguments',
              },
            },
          },
        ],
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

  const jestFnGenericCalls = root.findAll({
    rule: {
      pattern: 'jest.fn<$GENERIC_ARG1,$GENERIC_ARG2>($$$MATCHER_ARGS)',
      kind: 'call_expression',
    },
  });

  for (const node of jestFnGenericCalls) {
    const returnType = node.getMatch('GENERIC_ARG1')?.text();
    const parametersType = node.getMatch('GENERIC_ARG2')?.text();
    const matcherArgs = node.getMatch('MATCHER_ARGS')?.text();

    if (returnType && parametersType) {
      // Transform: jest.fn<ReturnType, Parameters>() -> vi.fn<(...args: Parameters) => ReturnType>()
      const args = matcherArgs ? `(${matcherArgs})` : '()';
      edits.push(
        node.replace(
          `vi.fn<(...args: ${parametersType}) => ${returnType}>${args}`,
        ),
      );
    }
  }

  if (jestFnGenericCalls.length > 0) {
    vitestImports.add('vi');
  }

  // Replace `jest.setTimeout` with `vi.setConfig({ testTimeout: ... })`
  const jestSetTimeoutCalls = root.findAll({
    rule: {
      pattern: 'jest.setTimeout($TIMEOUT)',
      kind: 'call_expression',
    },
  });

  for (const node of jestSetTimeoutCalls) {
    const timeoutArg = node.getMatch('TIMEOUT')?.text();

    if (timeoutArg) {
      edits.push(node.replace(`vi.setConfig({ testTimeout: ${timeoutArg} })`));
    }
  }

  if (jestSetTimeoutCalls.length > 0) {
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

  // Transform jest hooks with function references to arrow functions
  // eg beforeAll(someSetupFunction) -> beforeAll(() => { someSetupFunction() })
  const lifecycleHooks = ['beforeAll', 'beforeEach', 'afterAll', 'afterEach'];

  const hookCallsWithFunctionReferences = root.findAll({
    rule: {
      any: lifecycleHooks.map((hook) => ({
        pattern: `${hook}($ARG)`,
        kind: 'call_expression',
      })),
    },
  });

  for (const node of hookCallsWithFunctionReferences) {
    const arg = node.getMatch('ARG');
    if (arg) {
      const argText = arg.text();
      // Check if the argument is a function reference (not a function expression or arrow function)
      // Function references are typically identifiers or member expressions like 'scoringService.spy'
      const isFunctionReference =
        arg.kind() === 'identifier' || arg.kind() === 'member_expression';

      if (isFunctionReference) {
        // Wrap the function reference in an arrow function
        const edit = arg.replace(`() => { ${argText}() }`);
        edits.push(edit);
      }
    }
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
  // - expect(result).rejects.toThrow<ErrorType>({}) -> expect(result).rejects.toThrow({} satisfies ErrorType)
  // - await expect(result).resolves.toEqual<MyType>({}) -> await expect(result).resolves.toEqual({} satisfies MyType)
  //
  // Only transforms calls that contain .resolves or .rejects as these are the only cases
  // where Vitest doesn't support generics

  // Use exhaustive patterns to match all possible expect chains with resolves/rejects and generics
  const expectChainGenerics = root.findAll({
    rule: {
      any: [
        {
          pattern:
            'expect($EXPECT_ARG).resolves.$MATCHER<$$$GENERIC_ARGS>($$$MATCHER_ARGS)',
        },
        {
          pattern:
            'expect($EXPECT_ARG).rejects.$MATCHER<$$$GENERIC_ARGS>($$$MATCHER_ARGS)',
        },
        {
          pattern:
            'expect($EXPECT_ARG).not.resolves.$MATCHER<$$$GENERIC_ARGS>($$$MATCHER_ARGS)',
        },
        {
          pattern:
            'expect($EXPECT_ARG).not.rejects.$MATCHER<$$$GENERIC_ARGS>($$$MATCHER_ARGS)',
        },
        {
          pattern:
            'expect($EXPECT_ARG).resolves.not.$MATCHER<$$$GENERIC_ARGS>($$$MATCHER_ARGS)',
        },
        {
          pattern:
            'expect($EXPECT_ARG).rejects.not.$MATCHER<$$$GENERIC_ARGS>($$$MATCHER_ARGS)',
        },
        // Patterns with await keyword
        {
          pattern:
            'await expect($EXPECT_ARG).resolves.$MATCHER<$$$GENERIC_ARGS>($$$MATCHER_ARGS)',
        },
        {
          pattern:
            'await expect($EXPECT_ARG).rejects.$MATCHER<$$$GENERIC_ARGS>($$$MATCHER_ARGS)',
        },
        {
          pattern:
            'await expect($EXPECT_ARG).not.resolves.$MATCHER<$$$GENERIC_ARGS>($$$MATCHER_ARGS)',
        },
        {
          pattern:
            'await expect($EXPECT_ARG).not.rejects.$MATCHER<$$$GENERIC_ARGS>($$$MATCHER_ARGS)',
        },
        {
          pattern:
            'await expect($EXPECT_ARG).resolves.not.$MATCHER<$$$GENERIC_ARGS>($$$MATCHER_ARGS)',
        },
        {
          pattern:
            'await expect($EXPECT_ARG).rejects.not.$MATCHER<$$$GENERIC_ARGS>($$$MATCHER_ARGS)',
        },
      ],
    },
  });

  for (const node of expectChainGenerics) {
    // Extract pattern-matched components using getMultipleMatches for multi-token patterns
    const expectArg = node.getMatch('EXPECT_ARG')?.text();
    const matcher = node.getMatch('MATCHER')?.text();

    // Use getMultipleMatches for multi-token patterns - works correctly where getMatch fails
    const genericArgsNodes = node.getMultipleMatches('GENERIC_ARGS');
    const matcherArgsNodes = node.getMultipleMatches('MATCHER_ARGS');

    if (!expectArg || !matcher || genericArgsNodes.length === 0) {
      continue;
    }

    // Extract the generic type (should be a single node for the entire generic)
    const genericArgs = genericArgsNodes[0]?.text();

    if (!genericArgs) {
      continue;
    }

    // Filter out comma separators from the matched arguments
    const actualArgs = matcherArgsNodes.filter(
      (argNode) => argNode.text() !== ',',
    );

    if (actualArgs.length === 0) {
      // No arguments - skip transformation for empty calls
      continue;
    }

    // Extract the part before generics and reconstruct with satisfies
    const fullText = node.text();
    const beforeGeneric = fullText.substring(0, fullText.indexOf('<'));
    const argText = actualArgs[0].text();
    const replacement = `${beforeGeneric}(${argText} satisfies ${genericArgs})`;

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
