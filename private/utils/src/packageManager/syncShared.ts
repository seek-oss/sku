import { isScalar, type Document } from 'yaml';
import { MANAGED_BY_SKU_MARKER } from './pnpmWorkspaceDefaults.ts';

export type SyncMode = 'additive' | 'enforce';

export type RecordMutation = (message: string) => void;
export type Warn = (message: string) => void;

export interface SyncContext {
  doc: Document;
  mode: SyncMode;
  recordMutation: RecordMutation;
  warn: Warn;
}

export const getNodeKey = (node: unknown): string =>
  isScalar(node) ? String(node.value) : String(node);

export const hasManagedMarker = (comment?: string | null): boolean => {
  const trimmed = comment?.trim();
  if (!trimmed) {
    return false;
  }

  return (
    trimmed === MANAGED_BY_SKU_MARKER ||
    trimmed.endsWith(`# ${MANAGED_BY_SKU_MARKER}`)
  );
};

const formatComment = (explanatory?: string): string =>
  explanatory
    ? ` ${explanatory} # ${MANAGED_BY_SKU_MARKER}`
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
