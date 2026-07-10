import { parseAsync, Lang, type SgNode } from '@ast-grep/napi';

const unquote = (text: string) => text.replace(/^['"`]|['"`]$/g, '');

/** Find the child of an object whose key matches `key`. */
const getChildNode = (object: SgNode, key: string): SgNode | null =>
  object
    .children()
    .find(
      (child) =>
        child.kind() === 'pair' &&
        unquote(child.field('key')?.text() ?? '') === key,
    ) ?? null;

const hasKey = (object: SgNode, key: string): boolean =>
  getChildNode(object, key) !== null;

const findObjectLiteral = (node: SgNode | null | undefined): SgNode | null => {
  if (!node) {
    return null;
  }
  if (node.kind() === 'object') {
    return node;
  }
  // Handles `{ ... } satisfies SkuConfig`
  if (node.kind() === 'satisfies_expression') {
    return node.children().find((child) => child.kind() === 'object') ?? null;
  }
  return null;
};

/** Resolve `export default name` back to the value of `name`'s declaration. */
const findReference = (root: SgNode, name: string): SgNode | null =>
  root
    .find({
      rule: {
        kind: 'variable_declarator',
        has: { field: 'name', regex: `^${name}$` },
      },
    })
    ?.field('value') ?? null;

/**
 * Locate the sku config object literal, supporting:
 *
 * - `export default { ... }`
 * - `const config = { ... }; export default config;`
 *
 * Throws for shapes we don't support.
 */
const findConfigObject = (root: SgNode): SgNode => {
  const exported = root
    .find({ rule: { pattern: 'export default $OBJ' } })
    ?.getMatch('OBJ');

  const target =
    exported?.kind() === 'identifier'
      ? // handles `const config = { ... }; export default config;`
        findReference(root, exported.text())
      : exported;

  const object = findObjectLiteral(target);
  if (object) {
    return object;
  }

  throw new Error(
    'Unsupported sku config shape: only ESM configs (`export default`) can be edited. CJS configs (`module.exports = { ... }`) are not supported',
  );
};

/**
 * Insert `entry` as the first property of an object literal, preserving the existing contents.
 */
const insertProperty = (object: SgNode, entry: string): string => {
  const text = object.text();
  const afterBrace = text.indexOf('{') + 1;
  return `${text.slice(0, afterBrace)} ${entry},${text.slice(afterBrace)}`;
};

/**
 * Adds a `pathAliases` entry to a sku config, merging into any existing
 * `pathAliases` object. Returns the updated source, or `null` when no change is
 * needed (entry already present) or the config shape is unsupported.
 */
export const addPathAlias = async (
  source: string,
  alias: string,
  destination: string,
): Promise<string | null> => {
  const ast = await parseAsync(Lang.Tsx, source);
  const root = ast.root();

  const skuConfigObject = findConfigObject(root);
  if (!skuConfigObject) {
    return null;
  }

  const entry = `'${alias}': '${destination}'`;
  const existingPathAliases = getChildNode(skuConfigObject, 'pathAliases');

  if (existingPathAliases) {
    const pathAliases = existingPathAliases.field('value');
    // Only edit a plain object literal; bail on spreads, references, etc.
    if (pathAliases?.kind() !== 'object' || hasKey(pathAliases, alias)) {
      return null;
    }

    return root.commitEdits([
      pathAliases.replace(insertProperty(pathAliases, entry)),
    ]);
  }

  return root.commitEdits([
    skuConfigObject.replace(
      insertProperty(skuConfigObject, `pathAliases: { ${entry} }`),
    ),
  ]);
};
