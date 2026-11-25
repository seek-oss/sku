import MagicString, { type SourceMap } from 'magic-string';
import {
  parseSync,
  rawTransferSupported,
  visitorKeys,
  type ParserOptions,
} from 'oxc-parser';

export type AllowedCallees = Record<string, string[]>;

export interface DisplayNameOptions {
  /**
   * Extra callees that make the plugin add a `displayName` to the result.
   * The keys are module specifiers, and the values are the names of the exports to match.
   * These are added to the default, which is `{ react: ['createContext', 'forwardRef', 'memo'] }`.
   */
  allowedCallees?: AllowedCallees;
}

export const defaultAllowedCallees: Readonly<AllowedCallees> = Object.freeze({
  react: ['createContext', 'forwardRef', 'memo'],
});

export interface TransformOptions {
  /**
   * The language of the code.
   * If you do not set it, the plugin infers the language from the file name.
   * The plugin parses `js` as `jsx`.
   */
  language?: 'js' | 'jsx' | 'ts' | 'tsx';
  /**
   * The source type of the code.
   * If you do not set it, oxc-parser infers the source type from the file name.
   */
  sourceType?: ParserOptions['sourceType'];
  /**
   * Generate a source map.
   * @default true
   */
  sourcemap?: boolean;
  /**
   * Use the experimental raw transfer of oxc-parser to build the AST.
   * Raw transfer is much faster.
   * The plugin ignores this option if the runtime does not support raw transfer.
   * @default true
   */
  rawTransfer?: boolean;
}

export interface TransformResult {
  code: string;
  map: SourceMap | null;
}

// Loosely typed ESTree node: the walker is generic over every node type.
interface Node {
  type: string;
  start: number;
  end: number;
  [key: string]: any;
}

interface ImportBinding {
  source: string;
  /** `default` for default imports and `*` for namespace imports. */
  imported: string;
}

interface Identifier {
  node: Node;
  computed: boolean;
}

interface InsertedStatement {
  list: Node[];
  index: number;
  name: string;
}

/** Maps the name of a callee to the modules it can come from. */
type CalleeModuleMapping = Map<string, string[]>;

const STATEMENT_LIST_KEYS: Record<string, string> = {
  Program: 'body',
  BlockStatement: 'body',
  StaticBlock: 'body',
  TSModuleBlock: 'body',
  SwitchCase: 'consequent',
};

const FUNCTIONS = new Set([
  'ArrowFunctionExpression',
  'FunctionDeclaration',
  'FunctionExpression',
]);

export function createCalleeModuleMapping(
  allowedCallees: AllowedCallees = {},
): CalleeModuleMapping {
  const mapping: CalleeModuleMapping = new Map();
  for (const callees of [defaultAllowedCallees, allowedCallees]) {
    for (const [moduleName, methodNames] of Object.entries(callees)) {
      for (const methodName of methodNames) {
        const moduleNames = mapping.get(methodName) ?? [];
        moduleNames.push(moduleName);
        mapping.set(methodName, moduleNames);
      }
    }
  }
  return mapping;
}

/**
 * Returns the strings of which at least one must be in the code of a module
 * that the plugin can change.
 */
export function displayNameSearchTerms(mapping: CalleeModuleMapping): string[] {
  // JSX has a `<`, and `createElement` is the other way to create an element.
  return ['<', 'createElement', ...mapping.keys()];
}

function isJSX(node: Node | null | undefined): boolean {
  return node?.type === 'JSXElement' || node?.type === 'JSXFragment';
}

function isFunction(node: Node | null | undefined): boolean {
  return (
    node?.type === 'ArrowFunctionExpression' ||
    node?.type === 'FunctionExpression'
  );
}

/** An object method, getter or setter. Babel has a node type for these, but ESTree does not. */
function isObjectMethod(node: Node | null | undefined): boolean {
  return (
    node?.type === 'Property' &&
    node.value?.type === 'FunctionExpression' &&
    (node.method || node.kind !== 'init')
  );
}

function isObjectProperty(node: Node): boolean {
  return node.type === 'Property' && !isObjectMethod(node);
}

/** Checks if the node creates a scope, as `@babel/traverse` does. */
function isScope(node: Node, parent: Node | undefined): boolean {
  switch (node.type) {
    case 'Program':
    case 'CatchClause':
    case 'ClassDeclaration':
    case 'ClassExpression':
    case 'StaticBlock':
    case 'SwitchStatement':
    case 'ForStatement':
    case 'ForInStatement':
    case 'ForOfStatement':
    case 'MethodDefinition':
      return true;
    case 'Property':
      return isObjectMethod(node);
    case 'ArrowFunctionExpression':
    case 'FunctionDeclaration':
      return true;
    case 'FunctionExpression':
      // The method node is the scope in Babel.
      return !(
        parent &&
        (parent.type === 'MethodDefinition' || isObjectMethod(parent))
      );
    case 'BlockStatement':
      return !(
        parent &&
        (FUNCTIONS.has(parent.type) ||
          parent.type === 'CatchClause' ||
          parent.type === 'MethodDefinition' ||
          isObjectMethod(parent))
      );
    default:
      return false;
  }
}

/**
 * Generates a display name from an identifier or from a chain of member expressions.
 * Returns `null` for all other nodes.
 */
function generateNodeDisplayName(node: Node): string | null {
  if (node.type === 'Identifier') {
    return node.name;
  }

  if (node.type === 'MemberExpression') {
    const objectName = generateNodeDisplayName(node.object);
    const propertyName = generateNodeDisplayName(node.property);
    if (objectName === null || propertyName === null) {
      return null;
    }
    return node.computed
      ? `${objectName}[${propertyName}]`
      : `${objectName}.${propertyName}`;
  }

  return null;
}

function generateDisplayName(identifiers: Identifier[]): string | null {
  let displayName = '';
  for (const { node, computed } of identifiers) {
    // A key that is not computed is a name, and not an expression.
    const name =
      !computed &&
      node.type !== 'Identifier' &&
      node.type !== 'MemberExpression'
        ? null
        : generateNodeDisplayName(node);
    if (!name) {
      return null;
    }
    displayName += computed ? `[${name}]` : `.${name}`;
  }
  return displayName.slice(1);
}

/**
 * Checks if this function returns JSX nodes.
 * It does not do type-checking, which means that calling
 * other functions that return JSX will still return `false`.
 */
function doesReturnJSX(body: Node | null | undefined): boolean {
  if (!body) {
    return false;
  }

  const statements: Array<{ argument: Node | null } | null> =
    body.type === 'BlockStatement'
      ? body.body.map((statement: Node) => {
          if (statement.type === 'ReturnStatement') {
            return { argument: statement.argument };
          }
          if (
            statement.type === 'ExpressionStatement' &&
            statement.expression.type !== 'CallExpression'
          ) {
            return { argument: statement.expression };
          }
          return null;
        })
      : [body.type === 'CallExpression' ? null : { argument: body }];

  return statements.some((statement) => {
    if (!statement) {
      return false;
    }
    const current = statement.argument;

    if (
      current?.type === 'CallExpression' &&
      // detect *.createElement and count it as returning JSX
      // this could be improved a lot but will work for the 99% case
      current.callee.type === 'MemberExpression' &&
      current.callee.property.type === 'Identifier' &&
      current.callee.property.name === 'createElement'
    ) {
      return true;
    }

    if (current?.type === 'ConditionalExpression') {
      return isJSX(current.consequent) || isJSX(current.alternate);
    }

    if (current?.type === 'LogicalExpression') {
      return isJSX(current.left) || isJSX(current.right);
    }

    if (current?.type === 'ArrayExpression') {
      return current.elements.some((element: Node | null) => isJSX(element));
    }

    return isJSX(current);
  });
}

function collectImportBindings(program: Node): Map<string, ImportBinding> {
  const bindings = new Map<string, ImportBinding>();

  for (const statement of program.body as Node[]) {
    if (
      statement.type !== 'ImportDeclaration' ||
      statement.importKind === 'type'
    ) {
      continue;
    }

    const source = statement.source.value as string;
    for (const specifier of statement.specifiers as Node[]) {
      if (specifier.type === 'ImportDefaultSpecifier') {
        bindings.set(specifier.local.name, { source, imported: 'default' });
      } else if (specifier.type === 'ImportNamespaceSpecifier') {
        bindings.set(specifier.local.name, { source, imported: '*' });
      } else if (
        specifier.type === 'ImportSpecifier' &&
        specifier.importKind !== 'type'
      ) {
        const { imported } = specifier;
        bindings.set(specifier.local.name, {
          source,
          imported:
            imported.type === 'Identifier' ? imported.name : imported.value,
        });
      }
    }
  }

  return bindings;
}

// Raw transfer skips the JSON round trip when building the JS AST. It's experimental and untyped.
const isRawTransferSupported = rawTransferSupported();

const visitorKeysByType = visitorKeys as Record<
  string,
  readonly string[] | undefined
>;

const NO_OPTIONS: DisplayNameOptions = Object.freeze({});

const calleeModuleMappingCache = new WeakMap<
  DisplayNameOptions,
  CalleeModuleMapping
>();

function getCalleeModuleMapping(options: DisplayNameOptions) {
  let mapping = calleeModuleMappingCache.get(options);
  if (!mapping) {
    mapping = createCalleeModuleMapping(options.allowedCallees);
    calleeModuleMappingCache.set(options, mapping);
  }
  return mapping;
}

export function transform(
  code: string,
  filename: string,
  options: DisplayNameOptions = NO_OPTIONS,
  transformOptions: TransformOptions = {},
): TransformResult | null {
  const calleeModuleMapping = getCalleeModuleMapping(options);
  if (
    !displayNameSearchTerms(calleeModuleMapping).some((term) =>
      code.includes(term),
    )
  ) {
    return null;
  }

  const language =
    transformOptions.language === 'js' ? 'jsx' : transformOptions.language;

  const result = parseSync(filename, code, {
    lang: language,
    sourceType: transformOptions.sourceType,
    preserveParens: false,
    ...(isRawTransferSupported &&
      transformOptions.rawTransfer !== false && {
        experimentalRawTransfer: true,
      }),
  });

  const fatal = result.errors.find((error) => error.severity === 'Error');
  if (fatal) {
    throw new SyntaxError(`${filename}: ${fatal.message}`);
  }

  const program = result.program as unknown as Node;
  const importBindings = collectImportBindings(program);
  const magicString = new MagicString(code);

  // We allow duplicate names across files, so this is local to the file.
  const seenDisplayNames = new Set<string>();
  const insertedStatements: InsertedStatement[] = [];

  /** The nodes from the root to the node that the walk is visiting. */
  const stack: Node[] = [];

  /**
   * Checks if this is a call of one of the allowed callees:
   * - `memo()`, if `memo` is a named import of one of the allowed modules
   * - `React.memo()`, if `React` is a default or namespace import of one of the allowed modules
   */
  function isAllowedCallExpression(call: Node): boolean {
    const { callee } = call;

    if (callee.type === 'Identifier') {
      const binding = importBindings.get(callee.name);
      return Boolean(
        binding &&
        calleeModuleMapping.get(binding.imported)?.includes(binding.source),
      );
    }

    if (
      callee.type === 'MemberExpression' &&
      !callee.computed &&
      callee.object.type === 'Identifier' &&
      callee.property.type === 'Identifier'
    ) {
      const moduleNames = calleeModuleMapping.get(callee.property.name);
      const binding = importBindings.get(callee.object.name);
      return Boolean(
        moduleNames &&
        binding &&
        (binding.imported === 'default' || binding.imported === '*') &&
        moduleNames.includes(binding.source),
      );
    }

    return false;
  }

  /** Checks if the statement assigns `pattern` (like `foo.bar.displayName`). */
  function isAssignmentTo(statement: Node, pattern: string): boolean {
    return (
      statement.type === 'ExpressionStatement' &&
      statement.expression.type === 'AssignmentExpression' &&
      statement.expression.operator === '=' &&
      generateNodeDisplayName(statement.expression.left) === pattern
    );
  }

  /** Checks if this statement has been previously assigned a particular value. */
  function hasBeenAssignedPrev(
    list: Node[],
    index: number,
    pattern: string,
    name: string,
  ): boolean {
    return (
      list
        .slice(0, index)
        .some(
          (statement) =>
            isAssignmentTo(statement, pattern) &&
            statement.expression.right.type === 'Literal' &&
            statement.expression.right.value === name,
        ) ||
      insertedStatements.some(
        (inserted) =>
          inserted.list === list &&
          inserted.index < index &&
          inserted.name === name,
      )
    );
  }

  /** Checks if the name will be assigned later in the scope. */
  function hasBeenAssignedNext(
    list: Node[],
    index: number,
    pattern: string,
  ): boolean {
    return list
      .slice(index + 1)
      .some((statement) => isAssignmentTo(statement, pattern));
  }

  /** Returns the index in the stack of the node that is the scope of the node at `index`. */
  function findScopeIndex(index: number): number {
    for (let i = index; i >= 0; i--) {
      const node = stack[i];
      if (node && isScope(node, stack[i - 1])) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Adds a `displayName` to the function component if it is:
   *  - assigned to a variable or object path
   *  - not within other JSX elements
   *  - not called by a react hook or _createClass helper
   *
   * The node is the last node of the stack.
   */
  function addDisplayNamesToFunctionComponent(node: Node) {
    const identifiers: Identifier[] = [];
    if (isObjectMethod(node)) {
      if (node.computed) {
        return;
      }
      identifiers.push({ node: node.key, computed: false });
    }

    // A search stops at the parent scope of the scope of the node.
    const scopeIndex = findScopeIndex(stack.length - 1);
    const parentScopeIndex = findScopeIndex(scopeIndex - 1);
    const scopeNode = parentScopeIndex === -1 ? null : stack[parentScopeIndex];

    let assignmentIndex = -1;
    let hasObjectProperty = false;

    for (let i = stack.length - 1; i >= 0 && assignmentIndex === -1; i--) {
      const current = stack[i];
      if (!current) {
        return;
      }

      // we've hit the scope, stop going further up
      if (current === scopeNode) {
        return;
      }

      // Ignore functions within jsx
      if (isJSX(current)) {
        return;
      }

      if (current.type === 'CallExpression') {
        // Ignore immediately invoked function expressions (IIFEs)
        if (isFunction(current.callee)) {
          return;
        }

        // Ignore instances where displayNames are disallowed
        // _createClass(() => <Element />)
        // useMemo(() => <Element />)
        const calleeName =
          current.callee.type === 'Identifier'
            ? current.callee.name
            : undefined;
        if (
          calleeName &&
          (calleeName.startsWith('_') || calleeName.startsWith('use'))
        ) {
          return;
        }
      }

      // componentIdentifier = <Element />
      if (current.type === 'AssignmentExpression') {
        identifiers.unshift({ node: current.left, computed: false });
        assignmentIndex = i - 1;
        break;
      }

      // const componentIdentifier = <Element />
      if (current.type === 'VariableDeclarator') {
        // Ternary expression
        if (current.init?.type === 'ConditionalExpression') {
          const { consequent, alternate } = current.init;

          // Only add display name if variable is a function
          if (!isFunction(consequent) || !isFunction(alternate)) {
            continue;
          }
        }
        identifiers.unshift({ node: current.id, computed: false });
        assignmentIndex = i - 1;
        break;
      }

      // if this is not a continuous object key: value pair, stop processing it
      if (
        hasObjectProperty &&
        !(isObjectProperty(current) || current.type === 'ObjectExpression')
      ) {
        return;
      }

      // { componentIdentifier: <Element /> }
      if (isObjectProperty(current)) {
        hasObjectProperty = true;
        identifiers.unshift({ node: current.key, computed: current.computed });
      }
    }

    if (assignmentIndex === -1 || identifiers.length === 0) {
      return;
    }

    // The statement that declares or assigns the component, and the list that contains it.
    let statementIndex = assignmentIndex;
    const statement = stack[statementIndex];
    if (
      statement?.type !== 'VariableDeclaration' &&
      statement?.type !== 'ExpressionStatement'
    ) {
      return;
    }
    if (stack[statementIndex - 1]?.type === 'ExportNamedDeclaration') {
      statementIndex--;
    }
    const target = stack[statementIndex];
    const container = stack[statementIndex - 1];
    const listKey = container && STATEMENT_LIST_KEYS[container.type];
    if (!target || !container || !listKey) {
      return;
    }

    const list: Node[] = container[listKey];
    const index = list.indexOf(target);
    if (index === -1) {
      return;
    }

    const name = generateDisplayName(identifiers);
    if (!name) {
      return;
    }

    const pattern = `${name}.displayName`;

    // disallow duplicate names if they were assigned in different scopes
    if (
      seenDisplayNames.has(name) &&
      !hasBeenAssignedPrev(list, index, pattern, name)
    ) {
      return;
    }

    // skip unnecessary addition of name if it is reassigned later on
    if (hasBeenAssignedNext(list, index, pattern)) {
      return;
    }

    let lineStart = target.start;
    while (lineStart > 0 && /[ \t]/.test(code.charAt(lineStart - 1))) {
      lineStart--;
    }
    const indentation =
      lineStart === 0 || code[lineStart - 1] === '\n'
        ? code.slice(lineStart, target.start)
        : '';

    magicString.appendLeft(
      target.end,
      `\n${indentation}${pattern} = ${JSON.stringify(name)};`,
    );

    insertedStatements.push({ list, index, name });
    seenDisplayNames.add(name);
  }

  function enter(node: Node) {
    const parent = stack[stack.length - 2];

    if (node.type === 'CallExpression') {
      if (isAllowedCallExpression(node)) {
        addDisplayNamesToFunctionComponent(node);
      }
      return;
    }

    let body: Node | undefined;
    if (isObjectMethod(node)) {
      body = node.value.body;
    } else if (isFunction(node)) {
      // These are visited with their method node.
      if (parent?.type === 'MethodDefinition' || isObjectMethod(parent)) {
        return;
      }
      body = node.body;
    } else {
      return;
    }

    // if the parent is a call expression, make sure it's an allowed one
    if (parent?.type === 'CallExpression' && !isAllowedCallExpression(parent)) {
      return;
    }

    if (doesReturnJSX(body)) {
      addDisplayNamesToFunctionComponent(node);
    }
  }

  function visit(node: Node) {
    stack.push(node);
    enter(node);

    const keys = visitorKeysByType[node.type];
    if (keys) {
      for (const key of keys) {
        const child = node[key];
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item && typeof item.type === 'string') {
              visit(item);
            }
          }
        } else if (child && typeof child.type === 'string') {
          visit(child);
        }
      }
    }

    stack.pop();
  }

  visit(program);

  if (!magicString.hasChanged()) {
    return null;
  }

  return {
    code: magicString.toString(),
    map:
      transformOptions.sourcemap === false
        ? null
        : magicString.generateMap({
            source: filename,
            includeContent: true,
            hires: 'boundary',
          }),
  };
}
