import { parse, Lang, type Edit } from '@ast-grep/napi';

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

export const transform = (source: string) => {
  const ast = parse(Lang.Tsx, source);
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
      any: [{ kind: 'arrow_function' }, { kind: 'function_expression' }],
      not: { pattern: 'async $$$' },
      inside: {
        pattern: 'jest.mock($$$)',
        has: {
          pattern: 'jest.requireActual',
          kind: 'member_expression',
          stopBy: 'end',
        },
        // Prevent matching further formal_parameters within the factory function body
        stopBy: { kind: 'statement_block' },
      },
    },
  });

  // Prepend `async` to found mock factories
  for (const node of jestMockFactoryParameters) {
    const {
      start: { index },
    } = node.range();

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
