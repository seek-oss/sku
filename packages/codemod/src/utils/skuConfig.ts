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

/**
 * Locate the sku config object literal, supporting:
 *
 * - `export default { ... }` (optionally with `satisfies SkuConfig`)
 * - `const config = { ... }; export default config;`
 *
 * Throws for shapes we don't support.
 */
const findConfigObject = (root: SgNode): SgNode => {
  /** Match `pattern` and return its `$OBJ` capture only if it's an object. */
  const matchObject = (pattern: string): SgNode | null => {
    const match = root.find({ rule: { pattern } })?.getMatch('OBJ');
    return match?.kind() === 'object' ? match : null;
  };

  const directExport =
    matchObject('export default $OBJ satisfies $T') ??
    matchObject('export default $OBJ');

  if (directExport) {
    return directExport;
  }

  // `const config = { ... }; export default config;`
  const reference = root
    .find({ rule: { pattern: 'export default $OBJ' } })
    ?.getMatch('OBJ');

  if (reference?.kind() === 'identifier') {
    const value = root
      .find({
        rule: {
          kind: 'variable_declarator',
          has: { field: 'name', regex: `^${reference.text()}$` },
        },
      })
      ?.field('value');
    if (value?.kind() === 'object') {
      return value;
    }
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
