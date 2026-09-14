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

export const getNodeKey = (node: unknown): string =>
  isScalar(node) ? String(node.value) : String(node);

export const hasManagedMarker = (comment?: string | null): boolean =>
  Boolean(comment?.includes(MANAGED_BY_SKU_MARKER));

const formatComment = (explanatory?: string): string =>
  explanatory
    ? ` ${explanatory} ${MANAGED_BY_SKU_MARKER}`
    : ` ${MANAGED_BY_SKU_MARKER}`;

export const clearCommentBefore = (node: unknown): boolean => {
  if (!isScalar(node) || !node.commentBefore) {
    return false;
  }

  node.commentBefore = undefined;
  return true;
};

export const setManagedComment = (
  node: unknown,
  explanatory?: string,
): boolean => {
  if (!isScalar(node)) {
    return false;
  }

  const comment = formatComment(explanatory);
  const modified = node.comment !== comment || Boolean(node.commentBefore);
  node.comment = comment;
  node.commentBefore = undefined;
  return modified;
};

/** Narrows a node to a scalar holding a plain string value. */
export const isStringScalar = (
  node: unknown,
): node is Scalar & { value: string } =>
  isScalar(node) && typeof node.value === 'string';

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

export const findPair = (map: YAMLMap, key: string) =>
  map.items.find((pair) => getNodeKey(pair.key) === key);

export const findDocPair = (doc: Document, key: string) =>
  isMap(doc.contents) ? findPair(doc.contents, key) : undefined;

/** Clears a top-level key's leading comment. Returns whether anything changed. */
export const clearDocKeyComment = (doc: Document, key: string): boolean => {
  const pair = findDocPair(doc, key);
  return pair ? clearCommentBefore(pair.key) : false;
};

/**
 * Ensures a top-level key exists, adding an empty collection if missing.
 * Returns the collection node, or undefined if the key holds another type.
 */
export function ensureCollection(
  context: SyncContext,
  key: string,
  kind: 'array',
): YAMLSeq | undefined;
export function ensureCollection(
  context: SyncContext,
  key: string,
  kind: 'object',
): YAMLMap | undefined;
export function ensureCollection(
  context: SyncContext,
  key: string,
  kind: 'array' | 'object',
): YAMLSeq | YAMLMap | undefined {
  const { doc } = context;

  if (!doc.has(key)) {
    doc.set(key, doc.createNode(kind === 'array' ? [] : {}));
    context.recordMutation(`added ${key} to pnpm-workspace.yaml`);
  }

  const node = doc.get(key, true);
  if (kind === 'array') {
    return isSeq(node) ? node : undefined;
  }
  return isMap(node) ? node : undefined;
}
