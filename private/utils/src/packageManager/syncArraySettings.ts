import { isSeq, type YAMLSeq } from 'yaml';
import {
  arraySettings,
  MANAGED_BY_SKU_MARKER,
  type ArrayEntry,
} from './pnpmWorkspaceDefaults.ts';
import {
  createManagedNode,
  ensureCollection,
  hasManagedMarker,
  isStringScalar,
  setManagedComment,
  type CheckContext,
  type SyncContext,
} from './syncShared.ts';

const toCommentMap = (entries: readonly ArrayEntry[]) =>
  new Map(entries.map(({ value, comment }) => [value, comment] as const));

export const checkArraySettings = (context: CheckContext): void => {
  const { doc, failures } = context;

  for (const { key, entries } of arraySettings) {
    const defaultComments = toCommentMap(entries);

    if (!doc.has(key)) {
      failures.push(`pnpm-workspace.yaml: "${key}" is missing.`);
      continue;
    }

    const seqNode = doc.get(key, true);
    if (!isSeq(seqNode)) {
      continue;
    }

    const stringItems = seqNode.items.filter(isStringScalar);

    const seenValues = new Set<string>();
    for (const item of stringItems) {
      if (seenValues.has(item.value)) {
        failures.push(
          `pnpm-workspace.yaml: duplicate "${item.value}" in ${key}.`,
        );
      }
      seenValues.add(item.value);
    }

    for (const item of stringItems) {
      const val = item.value;
      if (defaultComments.has(val)) {
        if (!hasManagedMarker(item.comment)) {
          failures.push(
            `pnpm-workspace.yaml: "${val}" in ${key} matches sku's default but is missing the "[sku_managed]" marker.`,
          );
        }
      } else if (hasManagedMarker(item.comment)) {
        failures.push(
          `pnpm-workspace.yaml: "${val}" in ${key} is marked with "${MANAGED_BY_SKU_MARKER}", but is no longer a sku default. Delete its "${MANAGED_BY_SKU_MARKER}" marker to keep it as a user-managed entry.`,
        );
      }
    }

    for (const { value } of entries) {
      if (!seenValues.has(value)) {
        failures.push(`pnpm-workspace.yaml: "${value}" in ${key} is missing.`);
      }
    }
  }
};

const deduplicateArrayItems = (
  seqNode: YAMLSeq,
  key: string,
  context: SyncContext,
): void => {
  const seenValues = new Map<string, number>();
  const deduplicatedItems: typeof seqNode.items = [];

  for (const item of seqNode.items) {
    if (isStringScalar(item)) {
      const existingIndex = seenValues.get(item.value);
      if (existingIndex !== undefined) {
        const existingItem = deduplicatedItems[existingIndex];
        if (
          isStringScalar(existingItem) &&
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
 * Adopts default entries and removes retired ones in an existing array.
 *
 * @returns Whether the item should be removed from the sequence.
 */
const processSingleArrayItem = (
  item: unknown,
  defaultComments: ReadonlyMap<string, string | undefined>,
  key: string,
  context: SyncContext,
): boolean => {
  if (!isStringScalar(item)) {
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
    return true;
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
    const val = isStringScalar(item) ? item.value : '';
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
  const existingValues = new Set(
    seqNode.items.filter(isStringScalar).map((item) => item.value),
  );

  for (const { value, comment } of entries) {
    if (!existingValues.has(value)) {
      seqNode.items.push(createManagedNode(context.doc, value, comment));
      existingValues.add(value);
      context.recordMutation(`added ${value} to ${key} in pnpm-workspace.yaml`);
    }
  }
};

export const syncArraySettings = (context: SyncContext): void => {
  for (const { key, entries } of arraySettings) {
    const defaultComments = toCommentMap(entries);

    const seqNode = ensureCollection(context, key, 'array');
    if (!seqNode) {
      continue;
    }

    deduplicateArrayItems(seqNode, key, context);
    processExistingArrayItems(seqNode, defaultComments, key, context);
    appendMissingArrayDefaults(seqNode, entries, key, context);
  }
};
