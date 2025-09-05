import { parse, Lang, type Edit } from '@ast-grep/napi';

const jestGlobals = [
  'beforeAll',
  'beforeEach',
  'afterAll',
  'afterEach',
  'describe',
  'it',
  'test',
];

export const transform = (source: string) => {
  const ast = parse(Lang.Tsx, source);
  const root = ast.root();

  const edits: Edit[] = [];
  const vitestImports = new Set<string>();

  const jestMethods = root.findAll({
    // Matches `jest.<method>`
    rule: {
      pattern: 'jest',
      kind: 'member_expression > identifier',
    },
  });

  const jestRequireActualNodes = root.findAll({
    // Matches `jest.requireActual('<path>')`
    rule: {
      pattern: 'jest.requireActual($IMPORT_PATH)',
    },
  });

  const seenIds = new Set<number>();
  jestRequireActualNodes.forEach((node) => {
    let foundParentJestMock = false;

    for (const ancestor of node.ancestors()) {
      if (ancestor.kind() !== 'call_expression') {
        continue;
      }

      if (ancestor.text().startsWith('jest.mock')) {
        foundParentJestMock = true;
        const id = ancestor.id();
        if (seenIds.has(id)) {
          // We've already processed this ancestor
          break;
        }
        seenIds.add(id);

        const jestMockFactory = ancestor.field('arguments')?.child(3);
        if (!jestMockFactory) {
          // No factory function, nothing to replace
          break;
        }

        const res = jestMockFactory.findAll({
          rule: {
            pattern: 'jest.requireActual($IMPORT_PATH)',
          },
        });

        const factoryEdits = res
          .map((n) => {
            const importPathText = n.getMatch('IMPORT_PATH')?.text();
            if (importPathText) {
              // We wrap in parentheses to ensure valid syntax when the result is spread into an object
              return n.replace(`(await vi.importActual(${importPathText}))`);
            }
          })
          .filter((edit): edit is Edit => Boolean(edit));

        const newJestMockFactory = jestMockFactory.commitEdits(factoryEdits);
        const edit = jestMockFactory.replace(`async ${newJestMockFactory}`);
        if (edit) {
          edits.push(edit);
        }

        break;
      }
    }

    if (!foundParentJestMock) {
      // `jest.requireActual` used outside of `jest.mock`, replace directly
      const importPathText = node.getMatch('IMPORT_PATH')?.text();
      if (importPathText) {
        // We wrap in parentheses to ensure valid syntax when the result is spread into an object
        edits.push(node.replace(`(await vi.importActual(${importPathText}))`));
      }
    }
  });

  const jestMethodEdits = jestMethods.map((node) => node.replace('vi'));
  edits.push(...jestMethodEdits);

  if (jestMethodEdits.length > 0) {
    vitestImports.add('vi');
  }

  const foundJestGlobals = root.findAll({
    // Matches globals like `beforeAll()`, describe()`, `it()`, etc.
    rule: {
      any: jestGlobals.map((global) => ({
        pattern: global,
        kind: 'call_expression > identifier',
      })),
    },
  });

  foundJestGlobals.forEach((node) => {
    const t = node.text();
    vitestImports.add(t);
  });

  let result = root.commitEdits(edits);

  // Unsure why, but committing an edit for the vitest import causes a runtime panic, so we
  // manually add the import instead
  if (vitestImports.size > 0) {
    const serializedImports = Array.from(vitestImports).sort().join(', ');

    result = `import { ${serializedImports} } from 'vitest';\n${result}`;
  }

  return result;
};
