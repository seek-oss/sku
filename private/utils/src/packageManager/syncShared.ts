import {
  isMap,
  isScalar,
  isSeq,
  type Document,
  type Scalar,
  type YAMLMap,
  type YAMLSeq,
} from 'yaml';
import { MANAGED_BY_SKU_MARKER } from './pnpmWorkspaceDefaults.ts';

export const pnpmWorkspaceFileName = 'pnpm-workspace.yaml';

export type RecordMutation = (message: string) => void;

export interface CheckContext {
  doc: Document;
  failures: string[];
  advisories: string[];
}

export interface SyncContext {
  doc: Document;
  recordMutation: RecordMutation;
}

/** The plain value of a scalar node, or the node itself for collections. */
export const scalarValue = (node: unknown): unknown =>
  isScalar(node) ? node.value : node;

export const getNodeKey = (node: unknown): string => String(scalarValue(node));

/** Whether sku owns a node's value, as declared by its managed marker comment. */
export const isManaged = (node: unknown): boolean =>
  isScalar(node) && Boolean(node.comment?.includes(MANAGED_BY_SKU_MARKER));

/** Narrows a node to a scalar holding a plain string value. */
export const isStringScalar = (
  node: unknown,
): node is Scalar & { value: string } =>
  isScalar(node) && typeof node.value === 'string';

export const findPair = (map: YAMLMap, key: string) =>
  map.items.find((pair) => getNodeKey(pair.key) === key);

export const clearCommentBefore = (node: unknown): boolean => {
  if (!isScalar(node) || !node.commentBefore) {
    return false;
  }

  node.commentBefore = undefined;
  return true;
};

/** Clears a top-level key's leading comment. Returns whether anything changed. */
export const clearDocKeyComment = (doc: Document, key: string): boolean => {
  const pair = isMap(doc.contents) ? findPair(doc.contents, key) : undefined;
  return pair ? clearCommentBefore(pair.key) : false;
};

export const setManagedComment = (
  node: unknown,
  explanatory?: string,
): boolean => {
  if (!isScalar(node)) {
    return false;
  }

  const comment = explanatory
    ? ` ${explanatory} ${MANAGED_BY_SKU_MARKER}`
    : ` ${MANAGED_BY_SKU_MARKER}`;
  const modified = node.comment !== comment || Boolean(node.commentBefore);
  node.comment = comment;
  node.commentBefore = undefined;
  return modified;
};

/** Creates a node carrying sku's managed marker comment. */
export const createManagedNode = (
  doc: Document,
  value: unknown,
  explanatory?: string,
) => {
  const node = doc.createNode(value);
  setManagedComment(node, explanatory);
  return node;
};

const ensureNode = (context: SyncContext, key: string, empty: unknown) => {
  const { doc } = context;

  if (!doc.has(key)) {
    doc.set(key, doc.createNode(empty));
    context.recordMutation(`added ${key}`);
  }

  return doc.get(key, true);
};

/** Ensures a top-level key holds a sequence, adding an empty one if missing. */
export const ensureSeq = (
  context: SyncContext,
  key: string,
): YAMLSeq | undefined => {
  const node = ensureNode(context, key, []);

  if (isSeq(node)) {
    return node;
  }

  if (isStringScalar(node)) {
    // pnpm's matcher wraps a scalar in a one-entry list, so this keeps the
    // value's meaning while giving check and sync a list to work with.
    const seq = context.doc.createNode([]) as YAMLSeq;
    seq.items.push(node);
    context.doc.set(key, seq);
    context.recordMutation(`normalised ${key}`);
    return seq;
  }

  return undefined;
};

/** Ensures a top-level key holds a map, adding an empty one if missing. */
export const ensureMap = (
  context: SyncContext,
  key: string,
): YAMLMap | undefined => {
  const node = ensureNode(context, key, {});

  if (isMap(node)) {
    return node;
  }

  if (isStringScalar(node)) {
    const value = context.doc.createNode(true);
    value.comment = node.comment;

    const map = context.doc.createNode({}) as YAMLMap;
    map.set(node.value, value);
    context.doc.set(key, map);
    context.recordMutation(`normalised ${key}`);
    return map;
  }

  return undefined;
};

/** Describes a node's YAML kind for check messages, e.g. `"a list"`. */
export const nodeKind = (node: unknown): string => {
  if (isSeq(node)) {
    return 'a list';
  }
  if (isMap(node)) {
    return 'a map';
  }
  return node == null ? 'empty' : 'a single value';
};

const prefixed = (message: string) => `${pnpmWorkspaceFileName}: ${message}`;

/** Names a setting in a check message, e.g. `"allowBuilds.@swc/core"`. */
export const settingSubject = (path: string) => `"${path}"`;

/** Names an array entry in a check message, e.g. `"eslint" in publicHoistPattern`. */
export const entrySubject = (value: string, key: string) =>
  `"${value}" in ${key}`;

export const checkMessage = {
  missing: (subject: string) => prefixed(`${subject} is missing.`),
  missingWithDefault: (subject: string, recommended: unknown) =>
    prefixed(`${subject} is missing, recommended is ${recommended}.`),
  valueMismatch: (subject: string, current: unknown, recommended: unknown) =>
    prefixed(
      `${subject} has value ${String(current)}, recommended is ${recommended}.`,
    ),
  kindMismatch: (subject: string, expected: string, actual: string) =>
    prefixed(`${subject} should be ${expected}, but is ${actual}.`),
  missingMarker: (subject: string) =>
    prefixed(
      `${subject} matches sku's default but is missing the "${MANAGED_BY_SKU_MARKER}" marker.`,
    ),
  retiredMarker: (subject: string) =>
    prefixed(
      `${subject} is marked with "${MANAGED_BY_SKU_MARKER}", but is no longer a sku default.`,
    ),
};

/**
 * Compares a scalar against sku's default. The managed marker decides whether
 * drift is sku's to correct (a failure) or the user's own choice (an advisory).
 */
export const checkManagedScalar = (
  context: CheckContext,
  {
    subject,
    node,
    defaultValue,
  }: { subject: string; node: unknown; defaultValue: unknown },
): void => {
  const currentValue = scalarValue(node);
  const mismatch = () =>
    checkMessage.valueMismatch(subject, currentValue, defaultValue);

  if (isManaged(node)) {
    if (currentValue !== defaultValue) {
      context.failures.push(mismatch());
    }
    return;
  }

  if (currentValue === defaultValue) {
    context.failures.push(checkMessage.missingMarker(subject));
    return;
  }

  context.advisories.push(mismatch());
};
