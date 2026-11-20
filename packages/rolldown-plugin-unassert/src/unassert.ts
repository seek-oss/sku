/* eslint-disable no-param-reassign -- the transform mutates the AST nodes it is given */
import MagicString, { type SourceMap } from 'magic-string';
import {
  parseSync,
  rawTransferSupported,
  visitorKeys,
  type ParserOptions,
} from 'oxc-parser';

export interface UnassertOptions {
  /**
   * Names of the variables that hold assertion functions or objects.
   * If you set it, it replaces the default.
   * See `defaultOptions`.
   * @default ['assert']
   */
  variables?: string[];
  /**
   * Specifiers of the assertion modules.
   * If you set it, it replaces the default.
   * See `defaultOptions`.
   * @default ['assert', 'power-assert', 'node:assert']
   */
  modules?: string[];
}

export interface ResolvedUnassertOptions {
  variables: string[];
  modules: string[];
}

export const defaultOptions: Readonly<ResolvedUnassertOptions> = Object.freeze({
  variables: ['assert'],
  modules: ['assert', 'power-assert', 'node:assert'],
});

export function resolveOptions(
  options: UnassertOptions = {},
): ResolvedUnassertOptions {
  return { ...defaultOptions, ...options };
}

export interface TransformOptions {
  /**
   * The language of the code.
   * If you do not set it, oxc-parser infers the language from the file name.
   */
  language?: ParserOptions['lang'];
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

interface Path {
  /** The node, without the ParenthesizedExpression nodes that wrap it. */
  node: Node;
  /**
   * The value in the slot of the parent.
   * If parentheses wrap the node, this is the outermost ParenthesizedExpression.
   */
  slot: Node;
  parent: Path | null;
  key: string;
  index: number | null;
  start: number;
  end: number;
}

const STATEMENT_LISTS = new Set([
  'Program.body',
  'BlockStatement.body',
  'StaticBlock.body',
  'SwitchCase.consequent',
  'SwitchStatement.cases',
  'TSModuleBlock.body',
]);

const COMMA_LISTS = new Set([
  'VariableDeclaration.declarations',
  'SequenceExpression.expressions',
  'CallExpression.arguments',
  'NewExpression.arguments',
  'ArrayExpression.elements',
]);

const LOOPS = new Set([
  'DoWhileStatement',
  'ForInStatement',
  'ForStatement',
  'WhileStatement',
  'ForOfStatement',
]);

const EXPORT_DECLARATIONS = new Set([
  'ExportAllDeclaration',
  'ExportDefaultDeclaration',
  'ExportNamedDeclaration',
]);

function unwrapParens(node: Node): Node;
function unwrapParens(node: Node | null | undefined): Node | null | undefined;
function unwrapParens(node: Node | null | undefined) {
  while (node?.type === 'ParenthesizedExpression') {
    node = node.expression;
  }
  return node;
}

function isMemberExpressionLike(node: Node | null | undefined): node is Node {
  return node?.type === 'MemberExpression' || node?.type === 'MetaProperty';
}

/** A port of `matchesPattern` from `@babel/types`. */
function matchesPattern(
  member: Node,
  pattern: string,
  allowPartial: boolean,
): boolean {
  member = unwrapParens(member);
  if (!isMemberExpressionLike(member)) {
    return false;
  }

  const parts = pattern.split('.');
  const nodes: Node[] = [];
  let node: Node = member;

  while (isMemberExpressionLike(node)) {
    nodes.push(unwrapParens(node.property));
    node = unwrapParens(node.type === 'MetaProperty' ? node.meta : node.object);
  }

  nodes.push(node);

  if (nodes.length < parts.length) {
    return false;
  }

  if (!allowPartial && nodes.length > parts.length) {
    return false;
  }

  // Compare from the root object outwards, as the pattern is written.
  nodes.reverse();
  for (const [index, expected] of parts.entries()) {
    const part = nodes[index];
    if (part === undefined) {
      return false;
    }

    let value: string;

    if (part.type === 'Identifier') {
      value = part.name;
    } else if (part.type === 'Literal' && typeof part.value === 'string') {
      value = part.value;
    } else if (part.type === 'ThisExpression') {
      value = 'this';
    } else if (part.type === 'Super') {
      value = 'super';
    } else if (part.type === 'PrivateIdentifier') {
      value = `#${part.name}`;
    } else {
      return false;
    }

    if (value !== expected) {
      return false;
    }
  }

  return true;
}

function createMatchers({ variables, modules }: ResolvedUnassertOptions) {
  const isAssertionModuleName = (literal: Node | null | undefined) =>
    literal?.type === 'Literal' &&
    modules.some((name) => literal.value === name);

  const isAssertionVariableName = (id: Node) =>
    variables.some((name) => id.name === name);

  const isAssertionMethod = (callee: Node) =>
    variables.some((name) => matchesPattern(callee, name, true));

  const isAssertionFunction = (callee: Node) =>
    callee.type === 'Identifier' && isAssertionVariableName(callee);

  const isRequireAssert = (
    id: Node,
    init: Node | null | undefined,
  ): boolean => {
    if (id.type !== 'Identifier' || !isAssertionVariableName(id)) {
      return false;
    }

    init = unwrapParens(init);
    if (init?.type !== 'CallExpression') {
      return false;
    }

    const callee = unwrapParens(init.callee);
    if (callee.type !== 'Identifier' || callee.name !== 'require') {
      return false;
    }

    return isAssertionModuleName(unwrapParens(init.arguments[0]));
  };

  const isRequireAssertStrict = (
    id: Node,
    init: Node | null | undefined,
  ): boolean => {
    init = unwrapParens(init);
    if (init?.type !== 'MemberExpression') {
      return false;
    }
    if (!isRequireAssert(id, init.object)) {
      return false;
    }

    const property = init.property;
    return property.type === 'Identifier' && property.name === 'strict';
  };

  const isRemovalTarget = (id: Node, init: Node | null | undefined) =>
    isRequireAssert(id, init) || isRequireAssertStrict(id, init);

  return new Map<string, (node: Node, path: Path) => boolean>(
    Object.entries({
      AssignmentExpression(node: Node) {
        return (
          node.operator === '=' &&
          isRemovalTarget(unwrapParens(node.left), node.right)
        );
      },

      VariableDeclarator(node: Node) {
        return isRemovalTarget(node.id, node.init);
      },

      ImportDeclaration(node: Node) {
        if (!isAssertionModuleName(node.source)) {
          return false;
        }

        const firstSpecifier = node.specifiers[0];
        if (!firstSpecifier) {
          return false;
        }

        return isAssertionVariableName(firstSpecifier.local);
      },

      CallExpression(node: Node, path: Path) {
        const callee = unwrapParens(node.callee);
        if (
          isAssertionFunction(callee) ||
          isAssertionMethod(callee) ||
          matchesPattern(callee, 'console.assert', false)
        ) {
          return path.parent?.node.type === 'ExpressionStatement';
        }

        return false;
      },
    }),
  );
}

/**
 * Applies the same removals as `NodePath#remove()` in Babel, including the removal hooks.
 * It edits the source text, so the output matches the output of `babel-plugin-unassert`.
 */
class Remover {
  /**
   * Nodes that the remover removed or replaced.
   * The walk must not enter these nodes.
   */
  readonly dead = new WeakSet<Node>();

  /** Parent slots whose content the remover removed. */
  private readonly vacated = new WeakSet<Node>();

  private readonly magicString: MagicString;
  private readonly code: string;
  private readonly revisit: (path: Path) => void;

  constructor(
    magicString: MagicString,
    code: string,
    revisit: (path: Path) => void,
  ) {
    this.magicString = magicString;
    this.code = code;
    this.revisit = revisit;
  }

  remove(path: Path): boolean {
    const parent = path.parent;
    if (!parent) {
      return false;
    }

    const handled =
      this.applyRemovalHooks(path, parent) ??
      this.removeFromContainer(path, parent);
    if (handled) {
      this.markRemoved(path);
    }
    return handled;
  }

  private markRemoved(path: Path) {
    this.dead.add(path.node);
    this.vacated.add(path.slot);
  }

  private aliveSiblings(parent: Path, key: string): Node[] {
    const list: Array<Node | null> = parent.node[key];
    const alive: Node[] = [];
    for (const node of list) {
      if (node && !this.vacated.has(node)) {
        alive.push(node);
      }
    }

    return alive;
  }

  /** Returns undefined when no hook applies. */
  private applyRemovalHooks(self: Path, parent: Path): boolean | undefined {
    const parentType = parent.node.type;
    const removeParent =
      (self.key === 'test' &&
        (parentType === 'WhileStatement' ||
          parentType === 'DoWhileStatement' ||
          parentType === 'SwitchCase')) ||
      (self.key === 'declaration' && EXPORT_DECLARATIONS.has(parentType)) ||
      (self.key === 'body' && parentType === 'LabeledStatement') ||
      (self.key === 'declarations' &&
        parentType === 'VariableDeclaration' &&
        this.aliveSiblings(parent, self.key).length === 1) ||
      (self.key === 'expression' && parentType === 'ExpressionStatement');

    if (removeParent) {
      return this.remove(parent);
    }

    if (parentType === 'SequenceExpression') {
      const [first, second, ...rest] = this.aliveSiblings(parent, self.key);
      if (first && second && rest.length === 0) {
        return this.replaceWithChild(
          parent,
          first === self.slot ? second : first,
        );
      }
    }

    if (
      parentType === 'BinaryExpression' ||
      parentType === 'LogicalExpression'
    ) {
      return this.replaceWithChild(
        parent,
        self.key === 'left' ? parent.node.right : parent.node.left,
      );
    }

    if (
      (parentType === 'IfStatement' && self.key === 'consequent') ||
      (self.key === 'body' &&
        (LOOPS.has(parentType) || parentType === 'ArrowFunctionExpression'))
    ) {
      this.magicString.update(self.start, self.end, '{}');
      return true;
    }

    return undefined;
  }

  private removeFromContainer(self: Path, parent: Path): boolean {
    const location = `${parent.node.type}.${self.key}`;

    if (self.index !== null) {
      if (STATEMENT_LISTS.has(location)) {
        this.removeStatementText(self.start, self.end);
        return true;
      }
      if (COMMA_LISTS.has(location)) {
        this.removeListElement(self, parent);
        return true;
      }
      return false;
    }

    // Babel replaces the node with `null`; only optional fields accept that, anything else makes Babel throw.
    switch (location) {
      case 'IfStatement.alternate':
        this.magicString.remove(parent.node.consequent.end, self.end);
        return true;
      case 'VariableDeclarator.init':
        this.magicString.remove(parent.node.id.end, self.end);
        return true;
      case 'ForStatement.init':
      case 'ForStatement.test':
      case 'ForStatement.update':
      case 'ReturnStatement.argument':
      case 'YieldExpression.argument':
        this.magicString.remove(self.start, self.end);
        return true;
      default:
        return false;
    }
  }

  private removeListElement(self: Path, parent: Path) {
    const alive = this.aliveSiblings(parent, self.key);
    const index = alive.indexOf(self.slot);
    const next = alive[index + 1];
    const previous = alive[index - 1];

    if (next) {
      this.magicString.remove(self.start, next.start);
    } else if (previous) {
      this.magicString.remove(previous.end, self.end);
    } else {
      this.magicString.remove(self.start, this.skipTrailingComma(self.end));
    }
  }

  private skipTrailingComma(end: number): number {
    const match = /^\s*,/.exec(this.code.slice(end, end + 64));
    return match ? end + match[0].length : end;
  }

  /**
   * Removes the statement.
   * If the statement was the only content on its lines, it also removes those lines.
   */
  private removeStatementText(start: number, end: number) {
    const { code } = this;

    let lineStart = start;
    while (
      lineStart > 0 &&
      (code[lineStart - 1] === ' ' || code[lineStart - 1] === '\t')
    ) {
      lineStart--;
    }

    let lineEnd = end;
    while (
      lineEnd < code.length &&
      (code[lineEnd] === ' ' || code[lineEnd] === '\t')
    ) {
      lineEnd++;
    }

    const ownsLine =
      (lineStart === 0 || code[lineStart - 1] === '\n') &&
      (lineEnd === code.length ||
        code[lineEnd] === '\n' ||
        code[lineEnd] === '\r');
    if (!ownsLine) {
      this.magicString.remove(start, end);
      return;
    }

    if (code[lineEnd] === '\r') {
      lineEnd++;
    }
    if (code[lineEnd] === '\n') {
      lineEnd++;
    }
    this.magicString.remove(lineStart, lineEnd);
  }

  private replaceWithChild(parent: Path, keepSlot: Node): boolean {
    this.magicString.remove(parent.start, keepSlot.start);
    this.magicString.remove(keepSlot.end, parent.end);
    this.dead.add(parent.node);

    // The kept node now sits where its parent was, which may make it a removable statement.
    this.revisit({ ...parent, node: unwrapParens(keepSlot) });
    return true;
  }
}

/**
 * Returns the search terms for the configured variables.
 * Each pattern that the plugin can remove contains a search term in its own source range.
 * A search term is the root of a configured variable, or `assert` for `console.assert`.
 * An escape sequence can spell a name, because a backslash can produce a letter.
 * Examples are `\u0061`, `\x61`, and `'\a'` in a string.
 * Thus a backslash is also a search term.
 */
export function assertionSearchTerms(variables: readonly string[]): string[] {
  const roots = variables.map((variable) =>
    variable.replace(/\..*$/, '').replace(/^#/, ''),
  );
  return [...new Set([...roots, 'assert', '\\'])].filter(Boolean);
}

/**
 * Returns the sorted offsets of all search terms in the code.
 * The walk uses them to skip subtrees with no assertion.
 */
function findSearchTermOffsets(
  code: string,
  searchTerms: readonly string[],
): Int32Array {
  const offsets: number[] = [];
  for (const searchTerm of searchTerms) {
    for (
      let offset = code.indexOf(searchTerm);
      offset !== -1;
      offset = code.indexOf(searchTerm, offset + searchTerm.length)
    ) {
      offsets.push(offset);
    }
  }

  return Int32Array.from(offsets).toSorted();
}

function containsOffset(
  offsets: Int32Array,
  start: number,
  end: number,
): boolean {
  let low = 0;
  let high = offsets.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    const offset = offsets[middle];
    if (offset !== undefined && offset < start) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }

  const firstOffsetFromStart = offsets[low];
  return firstOffsetFromStart !== undefined && firstOffsetFromStart < end;
}

// Raw transfer skips the JSON round trip when building the JS AST. It's experimental and
// untyped. (`experimentalLazy` is faster still, but exposes oxc's internal node types, not ESTree.)
const isRawTransferSupported = rawTransferSupported();

const visitorKeysByType = visitorKeys as Record<
  string,
  readonly string[] | undefined
>;

function createPath(
  slot: Node,
  parent: Path | null,
  key: string,
  index: number | null,
): Path {
  return {
    node: unwrapParens(slot),
    slot,
    parent,
    key,
    index,
    start: slot.start,
    end: slot.end,
  };
}

interface PreparedOptions {
  matchers: ReturnType<typeof createMatchers>;
  searchTerms: string[];
}

const NO_OPTIONS: UnassertOptions = Object.freeze({});

const preparedOptionsCache = new WeakMap<UnassertOptions, PreparedOptions>();

/** Creates the matchers and the search terms once for each options object, not for each file. */
function prepareOptions(options: UnassertOptions): PreparedOptions {
  let prepared = preparedOptionsCache.get(options);
  if (!prepared) {
    const resolvedOptions = resolveOptions(options);
    prepared = {
      matchers: createMatchers(resolvedOptions),
      searchTerms: assertionSearchTerms(resolvedOptions.variables),
    };
    preparedOptionsCache.set(options, prepared);
  }

  return prepared;
}

export function transform(
  code: string,
  filename: string,
  options: UnassertOptions = NO_OPTIONS,
  transformOptions: TransformOptions = {},
): TransformResult | null {
  const { matchers, searchTerms } = prepareOptions(options);
  const searchTermOffsets = findSearchTermOffsets(code, searchTerms);
  if (searchTermOffsets.length === 0) {
    return null;
  }

  const result = parseSync(filename, code, {
    lang: transformOptions.language,
    sourceType: transformOptions.sourceType,
    ...(isRawTransferSupported &&
      transformOptions.rawTransfer !== false && {
        experimentalRawTransfer: true,
      }),
  });

  const fatal = result.errors.find((error) => error.severity === 'Error');
  if (fatal) {
    throw new SyntaxError(`${filename}: ${fatal.message}`);
  }

  const magicString = new MagicString(code);
  const remover = new Remover(magicString, code, (path) => visit(path));

  function visit(path: Path) {
    const { node } = path;
    if (remover.dead.has(node)) {
      return;
    }

    const matcher = matchers.get(node.type);
    if (matcher?.(node, path)) {
      remover.remove(path);
      if (remover.dead.has(node)) {
        return;
      }
    }

    const keys = visitorKeysByType[node.type];
    if (!keys) {
      return;
    }

    for (const key of keys) {
      const child = node[key];
      if (Array.isArray(child)) {
        for (let i = 0; i < child.length; i++) {
          const item = child[i];
          if (
            !item ||
            !containsOffset(searchTermOffsets, item.start, item.end)
          ) {
            continue;
          }

          if (remover.dead.has(node)) {
            return;
          }

          visit(createPath(item, path, key, i));
        }
      } else if (child && typeof child.type === 'string') {
        if (!containsOffset(searchTermOffsets, child.start, child.end)) {
          continue;
        }

        if (remover.dead.has(node)) {
          return;
        }

        visit(createPath(child, path, key, null));
      }
    }
  }

  visit(createPath(result.program, null, '', null));

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
