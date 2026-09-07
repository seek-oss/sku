import { isScalar, isSeq, type YAMLSeq } from 'yaml';
import {
  arraySettings,
  MANAGED_BY_SKU_MARKER,
  type ArrayEntry,
} from './pnpmWorkspaceDefaults.ts';
import {
  hasManagedMarker,
  setManagedComment,
  type SyncContext,
} from './syncShared.ts';

const deduplicateArrayItems = (
  seqNode: YAMLSeq,
  key: string,
  context: SyncContext,
): void => {
  const seenValues = new Map<string, number>();
  const deduplicatedItems: typeof seqNode.items = [];

  for (const item of seqNode.items) {
    if (isScalar(item) && typeof item.value === 'string') {
      const existingIndex = seenValues.get(item.value);
      if (existingIndex !== undefined) {
        const existingItem = deduplicatedItems[existingIndex];
        if (
          isScalar(existingItem) &&
          hasManagedMarker(existingItem.comment) &&
          !hasManagedMarker(item.comment)
        ) {
          deduplicatedItems[existingIndex] = item;
        }
        context.recordMutation(
          `removed duplicate ${item.value} from ${key} in pnpm-workspace.yaml`,
        );
        continue;
      }
      seenValues.set(item.value, deduplicatedItems.length);
      deduplicatedItems.push(item);
    } else {
      deduplicatedItems.push(item);
    }
  }

  seqNode.items = deduplicatedItems;
};

/**
 * Adopts default entries and flags retired ones in an existing array.
 *
 * @returns Whether the item should be removed from the sequence.
 */
const processSingleArrayItem = (
  item: unknown,
  defaultComments: ReadonlyMap<string, string | undefined>,
  key: string,
  context: SyncContext,
): boolean => {
  if (!isScalar(item) || typeof item.value !== 'string') {
    return false;
  }

  const val = item.value;
  if (defaultComments.has(val)) {
    if (setManagedComment(item, defaultComments.get(val))) {
      context.recordMutation(`adopted ${val} in ${key} in pnpm-workspace.yaml`);
    }
    return false;
  }

  const isMarked = hasManagedMarker(item.comment);
  if (isMarked) {
    if (context.mode === 'enforce') {
      return true;
    }
    context.warn(
      `pnpm-workspace.yaml: "${val}" in ${key} is marked with "${MANAGED_BY_SKU_MARKER}", but is no longer a sku default. Run "sku configure" to remove it, or delete its "${MANAGED_BY_SKU_MARKER}" marker to keep it as a user-managed entry.`,
    );
  }

  return false;
};

const processExistingArrayItems = (
  seqNode: YAMLSeq,
  defaultComments: ReadonlyMap<string, string | undefined>,
  key: string,
  context: SyncContext,
): void => {
  const indicesToRemove: number[] = [];

  for (const [i, item] of seqNode.items.entries()) {
    const shouldRemove = processSingleArrayItem(
      item,
      defaultComments,
      key,
      context,
    );
    if (shouldRemove) {
      indicesToRemove.push(i);
    }
  }

  // reversing the array so .splice() doesn't shift later indexes.
  for (const idx of indicesToRemove.toReversed()) {
    const item = seqNode.items[idx];
    const val = isScalar(item) ? String(item.value) : '';
    seqNode.items.splice(idx, 1);
    context.recordMutation(
      `removed retired entry ${val} from ${key} in pnpm-workspace.yaml`,
    );
  }
};

const appendMissingArrayDefaults = (
  seqNode: YAMLSeq,
  entries: readonly ArrayEntry[],
  key: string,
  context: SyncContext,
): void => {
  const existingValues = new Set<string>();

  for (const item of seqNode.items) {
    if (isScalar(item) && typeof item.value === 'string') {
      existingValues.add(item.value);
    }
  }

  for (const { value, comment } of entries) {
    if (!existingValues.has(value)) {
      const newItem = context.doc.createNode(value);
      setManagedComment(newItem, comment);
      seqNode.items.push(newItem);
      existingValues.add(value);
      context.recordMutation(`added ${value} to ${key} in pnpm-workspace.yaml`);
    }
  }
};

export const syncArraySettings = (context: SyncContext): void => {
  for (const { key, entries } of arraySettings) {
    const defaultComments = new Map(
      entries.map(({ value, comment }) => [value, comment] as const),
    );

    if (!context.doc.has(key)) {
      context.doc.set(key, context.doc.createNode([]));
      context.recordMutation(`added ${key} to pnpm-workspace.yaml`);
    }

    const seqNode = context.doc.get(key, true);
    if (!isSeq(seqNode)) {
      continue;
    }

    deduplicateArrayItems(seqNode, key, context);
    processExistingArrayItems(seqNode, defaultComments, key, context);
    appendMissingArrayDefaults(seqNode, entries, key, context);
  }
};
