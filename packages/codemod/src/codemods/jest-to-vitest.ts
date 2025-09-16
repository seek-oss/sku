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

  // Replace `jest.mock()` with `vi.mock()`, replace `jest.requireActual()` with
  // `await vi.importActual()` within the factory, and make the factory async if it isn't already

  const jestMockNodes = root.findAll({
    rule: {
      pattern: 'jest.mock',
      kind: 'member_expression',
    },
  });

  const seenJestRequireActualNodes = new Set<number>();
  for (const node of jestMockNodes) {
    const parent = node.parent();
    if (!parent?.is('call_expression')) {
      // No parent somehow, or parent isn't a call expression
      continue;
    }

    const jestMockFactory = parent.field('arguments')?.child(3);
    if (!jestMockFactory) {
      // No factory function, nothing to replace
      continue;
    }

    const requireActualNodes = jestMockFactory.findAll({
      rule: {
        pattern: 'jest.requireActual',
        kind: 'member_expression',
      },
    });

    const jestMockFactoryEdits = requireActualNodes.map((n) => {
      seenJestRequireActualNodes.add(n.id());
      return n.replace('await vi.importActual');
    });

    // Commit edits to the factory function because further targeted edits seem to be overwritten by
    // broader edits

    if (jestMockFactoryEdits.length > 0) {
      const newJestMockFactory =
        jestMockFactory.commitEdits(jestMockFactoryEdits);
      const factoryIsAsync = newJestMockFactory.startsWith('async');
      const replacementText = factoryIsAsync
        ? newJestMockFactory
        : `async ${newJestMockFactory}`;
      const edit = jestMockFactory.replace(replacementText);
      edits.push(edit);
    }
  }

  // Replace `jest.requireActual()` calls outside of `jest.mock()` factories

  const requireActualNodes = root.findAll({
    rule: {
      pattern: 'jest.requireActual',
      kind: 'member_expression',
    },
  });

  for (const node of requireActualNodes) {
    const nodeId = node.id();
    if (!seenJestRequireActualNodes.has(nodeId)) {
      const edit = node.replace('await vi.importActual');
      edits.push(edit);
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
      any: [
        { pattern: '$IDENTIFIER as jest.Mock', kind: 'as_expression' },
        {
          pattern: '$IDENTIFIER as jest.Mock<$$$_GENERIC_ARGS>',
          kind: 'as_expression',
        },
        {
          pattern: '$IDENTIFIER as jest.MockedFunction',
          kind: 'as_expression',
        },
        {
          pattern: '$IDENTIFIER as jest.MockedFunction<$$$_GENERIC_ARGS>',
          kind: 'as_expression',
        },
        {
          pattern:
            '$IDENTIFIER as jest.MockedFunction<$$$_GENERIC_ARGS> & $_OBJECT_TYPE',
          kind: 'as_expression',
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

  const result = root.commitEdits(edits);

  // Unsure why, but committing an edit for the vitest import causes a runtime panic, so we
  // manually add the import instead
  if (vitestImports.size > 0) {
    const serializedImports = Array.from(vitestImports).sort().join(', ');

    return `import { ${serializedImports} } from 'vitest';\n${result}`;
  }

  return result;
};
