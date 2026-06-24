import { parseAsync, Lang, type SgNode } from '@ast-grep/napi';

const unquote = (text: string) => text.replace(/^['"`]|['"`]$/g, '');

/** Find the `pair` children of an object whose key matches `key`. */
const findPair = (object: SgNode, key: string): SgNode | null =>
  object
    .children()
    .find(
      (child) =>
        child.kind() === 'pair' &&
        unquote(child.field('key')?.text() ?? '') === key,
    ) ?? null;

const hasKey = (object: SgNode, key: string): boolean =>
  findPair(object, key) !== null;

/**
 * Locate the sku config object literal, supporting:
 *
 * - `export default { ... }` (optionally with `satisfies SkuConfig`)
 * - `module.exports = { ... }`
 * - `const config = { ... }; export default config;`
 *
 * Returns `null` for shapes we can't safely edit, leaving the file untouched.
 */
const findConfigObject = (root: SgNode): SgNode | null => {
  /** Match `pattern` and return its `$OBJ` capture only if it's an object. */
  const matchObject = (pattern: string): SgNode | null => {
    const match = root.find({ rule: { pattern } })?.getMatch('OBJ');
    return match?.kind() === 'object' ? match : null;
  };

  const directExport =
    matchObject('export default $OBJ satisfies $T') ??
    matchObject('export default $OBJ') ??
    matchObject('module.exports = $OBJ');
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

  return null;
};

/**
 * Insert `entry` as the first property of an object literal, preserving the
 * existing contents. The result is intentionally unformatted; `sku format` is
 * run after the codemod to fix indentation and spacing.
 *
 * `entry` should be the property text without a trailing comma, e.g.
 * `"'#src/*': './src/*'"`.
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
 *
 * Uses `@ast-grep/napi` to surgically insert text without reformatting the rest
 * of the file.
 */
export const addPathAlias = async (
  source: string,
  alias: string,
  destination: string,
): Promise<string | null> => {
  const ast = await parseAsync(Lang.Tsx, source);
  const root = ast.root();

  const configObject = findConfigObject(root);
  if (!configObject) {
    return null;
  }

  const entry = `'${alias}': '${destination}'`;
  const existing = findPair(configObject, 'pathAliases');

  if (existing) {
    const aliases = existing.field('value');
    // Only edit a plain object literal; bail on spreads, references, etc.
    if (aliases?.kind() !== 'object' || hasKey(aliases, alias)) {
      return null;
    }

    return root.commitEdits([aliases.replace(insertProperty(aliases, entry))]);
  }

  return root.commitEdits([
    configObject.replace(
      insertProperty(configObject, `pathAliases: { ${entry} }`),
    ),
  ]);
};
