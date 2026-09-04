import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  Document,
  isMap,
  isScalar,
  isSeq,
  parseDocument,
  type YAMLMap,
  type YAMLSeq,
} from 'yaml';
import { caution } from '../console/styles.ts';
import { rootDir } from './packageManager.ts';
import {
  arraySettings,
  defaultPnpmWorkspaceConfig,
  MANAGED_BY_SKU_MARKER,
  MANAGED_BY_SKU_COMMENT,
  objectSettings,
  singleValueSettings,
  type ArrayEntry,
} from './pnpmWorkspaceDefaults.ts';

export type SyncMode = 'additive' | 'enforce';

export interface EnsurePnpmWorkspaceConfigOptions {
  targetDir?: string;
  mode?: SyncMode;
  create?: boolean;
}

type RecordMutation = (message: string) => void;
type Warn = (message: string) => void;

interface SyncContext {
  doc: Document;
  mode: SyncMode;
  recordMutation: RecordMutation;
  warn: Warn;
}

const getNodeKey = (node: unknown): string =>
  isScalar(node) ? String(node.value) : String(node);

const hasManagedMarker = (comment?: string | null): boolean => {
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

const clearCommentBefore = (node: unknown): boolean => {
  if (!isScalar(node) || !node.commentBefore) {
    return false;
  }

  node.commentBefore = undefined;
  return true;
};

const setManagedComment = (node: unknown, explanatory?: string): boolean => {
  if (!isScalar(node)) {
    return false;
  }

  const comment = formatComment(explanatory);
  const modified = node.comment !== comment || Boolean(node.commentBefore);
  node.comment = comment;
  node.commentBefore = undefined;
  return modified;
};

const findMapPair = (doc: Document, key: string) => {
  if (!isMap(doc.contents)) {
    return undefined;
  }

  return doc.contents.items.find((pair) => getNodeKey(pair.key) === key);
};

const markPairAsManaged = (
  pair: { key: unknown; value: unknown },
  explanatory?: string,
): boolean => {
  const modified = setManagedComment(pair.value, explanatory);
  return clearCommentBefore(pair.key) || modified;
};

const markSingleValueAsManaged = (
  node: unknown,
  explanatory: string | undefined,
  doc: Document,
  key: string,
): boolean => {
  const modified = setManagedComment(node, explanatory);
  const pair = findMapPair(doc, key);
  return (pair ? clearCommentBefore(pair.key) : false) || modified;
};

const migrateConfigDependencies = (
  doc: Document,
  recordMutation: RecordMutation,
): void => {
  if (!doc.has('configDependencies')) {
    return;
  }

  const cd = doc.get('configDependencies', true);
  let modified = false;

  if (isMap(cd)) {
    const remainingItems = cd.items.filter(
      (pair) => getNodeKey(pair.key) !== 'pnpm-plugin-sku',
    );
    modified = remainingItems.length !== cd.items.length;
    cd.items = remainingItems;
  } else if (isSeq(cd)) {
    const remainingItems = cd.items.filter(
      (item) => getNodeKey(item) !== 'pnpm-plugin-sku',
    );
    modified = remainingItems.length !== cd.items.length;
    cd.items = remainingItems;
  }

  if (modified) {
    recordMutation(
      'removed pnpm-plugin-sku from configDependencies in pnpm-workspace.yaml',
    );

    if (isMap(cd) || isSeq(cd)) {
      if (cd.items.length === 0) {
        doc.delete('configDependencies');
      }
    }
  }
};

const handleMatchingSingleValue = (
  node: unknown,
  explanatory: string | undefined,
  currentValue: unknown,
  doc: Document,
  key: string,
  context: SyncContext,
): void => {
  if (isScalar(node)) {
    if (markSingleValueAsManaged(node, explanatory, doc, key)) {
      context.recordMutation(
        `adopted ${key}: ${String(currentValue)} in pnpm-workspace.yaml`,
      );
    }
    return;
  }

  const wrapped = doc.createNode(currentValue);
  setManagedComment(wrapped, explanatory);
  doc.set(key, wrapped);
  context.recordMutation(
    `adopted ${key}: ${String(currentValue)} in pnpm-workspace.yaml`,
  );
};

const updateExistingSingleValue = (
  key: string,
  defaultValue: string | number | boolean,
  explanatory: string | undefined,
  context: SyncContext,
): void => {
  const { doc, mode, recordMutation, warn } = context;
  const node = doc.get(key, true);
  const currentValue = isScalar(node) ? node.value : doc.get(key);

  if (currentValue === defaultValue) {
    handleMatchingSingleValue(
      node,
      explanatory,
      currentValue,
      doc,
      key,
      context,
    );
    return;
  }

  if (mode === 'enforce') {
    const updatedNode = doc.createNode(defaultValue);
    setManagedComment(updatedNode, explanatory);
    doc.set(key, updatedNode);
    const pair = findMapPair(doc, key);
    if (pair) {
      clearCommentBefore(pair.key);
    }
    recordMutation(
      `updated ${key}: ${String(currentValue)} → ${defaultValue} in pnpm-workspace.yaml`,
    );
    return;
  }

  warn(
    `pnpm-workspace.yaml: "${key}" has value ${String(currentValue)}, recommended is ${defaultValue}. Run "sku configure" to align.`,
  );
};

const syncSingleValue = (
  { key, value: defaultValue, comment }: (typeof singleValueSettings)[number],
  context: SyncContext,
): void => {
  const { doc, recordMutation } = context;

  if (!doc.has(key)) {
    const node = doc.createNode(defaultValue);
    setManagedComment(node, comment);
    doc.set(key, node);
    recordMutation(`added ${key}: ${defaultValue} to pnpm-workspace.yaml`);
    return;
  }

  updateExistingSingleValue(key, defaultValue, comment, context);
};

const syncSingleValueSettings = (context: SyncContext): void => {
  for (const setting of singleValueSettings) {
    syncSingleValue(setting, context);
  }
};

const syncExistingObjectPair = (
  pair: { key: unknown; value: unknown },
  key: string,
  subKey: string,
  defaultVal: boolean,
  context: SyncContext,
): void => {
  const { doc, mode, recordMutation, warn } = context;

  if (!isScalar(pair.value)) {
    return;
  }

  const currentVal = pair.value.value;
  if (currentVal === defaultVal) {
    if (markPairAsManaged(pair)) {
      recordMutation(
        `adopted ${key}.${subKey}: ${String(currentVal)} in pnpm-workspace.yaml`,
      );
    }
    return;
  }

  if (!hasManagedMarker(pair.value.comment)) {
    return;
  }

  if (mode === 'enforce') {
    pair.value = doc.createNode(defaultVal);
    setManagedComment(pair.value);
    clearCommentBefore(pair.key);
    recordMutation(
      `updated ${key}.${subKey}: ${String(currentVal)} → ${defaultVal} in pnpm-workspace.yaml`,
    );
    return;
  }

  warn(
    `pnpm-workspace.yaml: "${key}.${subKey}" has value ${String(currentVal)}, recommended is ${defaultVal}. Run "sku configure" to align.`,
  );
};

const syncObjectPair = (
  mapNode: YAMLMap,
  key: string,
  subKey: string,
  defaultVal: boolean,
  context: SyncContext,
): void => {
  const pair = mapNode.items.find((item) => getNodeKey(item.key) === subKey);

  if (!pair) {
    const valNode = context.doc.createNode(defaultVal);
    setManagedComment(valNode);
    mapNode.set(subKey, valNode);
    context.recordMutation(
      `added ${key}.${subKey}: ${defaultVal} to pnpm-workspace.yaml`,
    );
    return;
  }

  syncExistingObjectPair(pair, key, subKey, defaultVal, context);
};

const cleanRetiredObjectKeys = (
  mapNode: YAMLMap,
  key: string,
  defaultObj: Readonly<Record<string, boolean>>,
  context: SyncContext,
): void => {
  const { mode, recordMutation, warn } = context;
  const itemsToRemove: string[] = [];
  for (const pair of mapNode.items) {
    const subKey = getNodeKey(pair.key);
    if (!(subKey in defaultObj)) {
      const isMarked =
        isScalar(pair.value) && hasManagedMarker(pair.value.comment);
      if (isMarked) {
        if (mode === 'enforce') {
          itemsToRemove.push(subKey);
        } else {
          warn(
            `pnpm-workspace.yaml: "${subKey}" in ${key} is marked with "${MANAGED_BY_SKU_COMMENT}", but is no longer a sku default. Run "sku configure" to remove it, or delete its "${MANAGED_BY_SKU_COMMENT}" marker to keep it as a user-managed entry.`,
          );
        }
      }
    }
  }

  for (const subKey of itemsToRemove) {
    mapNode.delete(subKey);
    recordMutation(
      `removed retired entry ${key}.${subKey} from pnpm-workspace.yaml`,
    );
  }
};

const syncObjectSettings = (context: SyncContext): void => {
  const { doc } = context;

  for (const { key, entries } of objectSettings) {
    if (!doc.has(key)) {
      doc.set(key, doc.createNode({}));
      context.recordMutation(`added ${key} to pnpm-workspace.yaml`);
    }

    const mapNode = doc.get(key, true);
    if (!isMap(mapNode)) {
      continue;
    }

    for (const [subKey, defaultVal] of Object.entries(entries)) {
      syncObjectPair(mapNode, key, subKey, defaultVal, context);
    }

    cleanRetiredObjectKeys(mapNode, key, entries, context);
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
      `pnpm-workspace.yaml: "${val}" in ${key} is marked with "${MANAGED_BY_SKU_COMMENT}", but is no longer a sku default. Run "sku configure" to remove it, or delete its "${MANAGED_BY_SKU_COMMENT}" marker to keep it as a user-managed entry.`,
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

  for (let i = 0; i < seqNode.items.length; i++) {
    const shouldRemove = processSingleArrayItem(
      seqNode.items[i],
      defaultComments,
      key,
      context,
    );
    if (shouldRemove) {
      indicesToRemove.push(i);
    }
  }

  for (let i = indicesToRemove.length - 1; i >= 0; i--) {
    const idx = indicesToRemove[i];
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

const syncArraySettings = (context: SyncContext): void => {
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

export async function ensurePnpmWorkspaceConfig(
  options: EnsurePnpmWorkspaceConfigOptions = {},
): Promise<void> {
  const mode = options.mode ?? 'additive';
  const shouldCreate = options.create ?? false;
  const targetDir = options.targetDir ?? rootDir ?? process.cwd();
  const filePath = join(targetDir, 'pnpm-workspace.yaml');
  const fileExisted = existsSync(filePath);

  if (!fileExisted && !shouldCreate) {
    return;
  }

  let originalContent = '';
  let doc: Document;

  if (fileExisted) {
    originalContent = await readFile(filePath, 'utf-8');
    doc = parseDocument(originalContent);
    if (!doc.contents) {
      doc.contents = doc.createNode({});
    } else if (!isMap(doc.contents)) {
      throw new Error(
        `Cannot sync ${filePath}: the document must contain a YAML mapping`,
      );
    }
  } else {
    doc = new Document(structuredClone(defaultPnpmWorkspaceConfig));
  }

  let modified = false;

  const recordMutation: RecordMutation = (message) => {
    modified = true;
    console.log(message);
  };

  if (!fileExisted) {
    recordMutation('created pnpm-workspace.yaml');
  }

  const warn: Warn = (message) => {
    console.warn(caution(message));
  };

  const context: SyncContext = { doc, mode, recordMutation, warn };

  migrateConfigDependencies(doc, recordMutation);
  syncSingleValueSettings(context);
  syncObjectSettings(context);
  syncArraySettings(context);

  if (modified) {
    const newContent = doc.toString();
    if (newContent !== originalContent) {
      await writeFile(filePath, newContent, 'utf-8');
    }
  }
}
