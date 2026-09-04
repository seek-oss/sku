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
  explanatoryComments,
  MANAGED_BY_SKU_MARKER,
  MANAGED_BY_SKU_COMMENT,
  objectSettings,
  singleValueSettings,
  type PnpmWorkspaceConfig,
} from './pnpmWorkspaceDefaults.ts';

export type SyncMode = 'additive' | 'enforce';

export interface EnsurePnpmWorkspaceConfigOptions {
  targetDir?: string;
  mode?: SyncMode;
  create?: boolean;
}

type LogMutation = (message: string) => void;
type Warn = (message: string) => void;

interface SyncContext {
  doc: Document;
  mode: SyncMode;
  logMutation: LogMutation;
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

const formatComment = (explanatory?: string): string => {
  if (!explanatory) {
    return ` ${MANAGED_BY_SKU_MARKER}`;
  }
  const cleanExp = explanatory.replace(/^#\s*/, '').trim();
  return ` ${cleanExp} # ${MANAGED_BY_SKU_MARKER}`;
};

const getExplanatoryComment = (
  key: keyof PnpmWorkspaceConfig,
): string | undefined => {
  const comment = explanatoryComments[key as keyof typeof explanatoryComments];
  return typeof comment === 'string' ? comment : undefined;
};

const getExplanatoryComments = (
  key: keyof PnpmWorkspaceConfig,
): Record<string, string> | undefined => {
  const comments = explanatoryComments[key as keyof typeof explanatoryComments];
  return comments && typeof comments === 'object' && !Array.isArray(comments)
    ? (comments as Record<string, string>)
    : undefined;
};

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
  logMutation: LogMutation,
): boolean => {
  if (!doc.has('configDependencies')) {
    return false;
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
    logMutation(
      'removed pnpm-plugin-sku from configDependencies in pnpm-workspace.yaml',
    );

    if (isMap(cd) || isSeq(cd)) {
      if (cd.items.length === 0) {
        doc.delete('configDependencies');
      }
    }
  }

  return modified;
};

const handleMatchingSingleValue = (
  node: unknown,
  explanatory: string | undefined,
  currentValue: unknown,
  doc: Document,
  key: string,
  context: SyncContext,
): boolean => {
  if (isScalar(node)) {
    if (markSingleValueAsManaged(node, explanatory, doc, key)) {
      context.logMutation(
        `adopted ${key}: ${String(currentValue)} in pnpm-workspace.yaml`,
      );
      return true;
    }
    return false;
  }

  const wrapped = doc.createNode(currentValue);
  setManagedComment(wrapped, explanatory);
  doc.set(key, wrapped);
  context.logMutation(
    `adopted ${key}: ${String(currentValue)} in pnpm-workspace.yaml`,
  );
  return true;
};

const updateExistingSingleValue = (
  key: string,
  defaultValue: string | number | boolean,
  explanatory: string | undefined,
  context: SyncContext,
): boolean => {
  const { doc, mode, logMutation, warn } = context;
  const node = doc.get(key, true);
  const currentValue = isScalar(node) ? node.value : doc.get(key);

  if (currentValue === defaultValue) {
    return handleMatchingSingleValue(
      node,
      explanatory,
      currentValue,
      doc,
      key,
      context,
    );
  }

  if (mode === 'enforce') {
    const updatedNode = doc.createNode(defaultValue);
    setManagedComment(updatedNode, explanatory);
    doc.set(key, updatedNode);
    const pair = findMapPair(doc, key);
    if (pair) {
      clearCommentBefore(pair.key);
    }
    logMutation(
      `updated ${key}: ${String(currentValue)} → ${defaultValue} in pnpm-workspace.yaml`,
    );
    return true;
  }

  warn(
    `pnpm-workspace.yaml: "${key}" has value ${String(currentValue)}, recommended is ${defaultValue}. Run "sku configure" to align.`,
  );
  return false;
};

const syncSingleValue = (
  key: (typeof singleValueSettings)[number],
  context: SyncContext,
): boolean => {
  const { doc, logMutation } = context;
  const defaultValue: string | number | boolean =
    defaultPnpmWorkspaceConfig[key];
  const explanatory = getExplanatoryComment(key);

  if (!doc.has(key)) {
    const node = doc.createNode(defaultValue);
    setManagedComment(node, explanatory);
    doc.set(key, node);
    logMutation(`added ${key}: ${defaultValue} to pnpm-workspace.yaml`);
    return true;
  }

  return updateExistingSingleValue(key, defaultValue, explanatory, context);
};

const syncSingleValueSettings = (context: SyncContext): boolean => {
  let modified = false;
  for (const key of singleValueSettings) {
    if (syncSingleValue(key, context)) {
      modified = true;
    }
  }
  return modified;
};

const syncExistingObjectPair = (
  pair: { key: unknown; value: unknown },
  key: string,
  subKey: string,
  defaultVal: boolean,
  context: SyncContext,
): boolean => {
  const { doc, mode, logMutation, warn } = context;

  if (!isScalar(pair.value)) {
    return false;
  }

  const currentVal = pair.value.value;
  if (currentVal === defaultVal) {
    if (markPairAsManaged(pair)) {
      logMutation(
        `adopted ${key}.${subKey}: ${String(currentVal)} in pnpm-workspace.yaml`,
      );
      return true;
    }
    return false;
  }

  if (!hasManagedMarker(pair.value.comment)) {
    return false;
  }

  if (mode === 'enforce') {
    pair.value = doc.createNode(defaultVal);
    setManagedComment(pair.value);
    clearCommentBefore(pair.key);
    logMutation(
      `updated ${key}.${subKey}: ${String(currentVal)} → ${defaultVal} in pnpm-workspace.yaml`,
    );
    return true;
  }

  warn(
    `pnpm-workspace.yaml: "${key}.${subKey}" has value ${String(currentVal)}, recommended is ${defaultVal}. Run "sku configure" to align.`,
  );
  return false;
};

const syncObjectPair = (
  mapNode: YAMLMap,
  key: string,
  subKey: string,
  defaultVal: boolean,
  context: SyncContext,
): boolean => {
  const pair = mapNode.items.find((item) => getNodeKey(item.key) === subKey);

  if (!pair) {
    const valNode = context.doc.createNode(defaultVal);
    setManagedComment(valNode);
    mapNode.set(subKey, valNode);
    context.logMutation(
      `added ${key}.${subKey}: ${defaultVal} to pnpm-workspace.yaml`,
    );
    return true;
  }

  return syncExistingObjectPair(pair, key, subKey, defaultVal, context);
};

const cleanRetiredObjectKeys = (
  mapNode: YAMLMap,
  key: string,
  defaultObj: Record<string, boolean>,
  context: SyncContext,
): boolean => {
  const { mode, logMutation, warn } = context;
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
    logMutation(
      `removed retired entry ${key}.${subKey} from pnpm-workspace.yaml`,
    );
  }

  return itemsToRemove.length > 0;
};

const syncObjectSettings = (context: SyncContext): boolean => {
  const { doc } = context;
  let modified = false;

  for (const key of objectSettings) {
    const defaultObj = defaultPnpmWorkspaceConfig[key] as Record<
      string,
      boolean
    >;

    if (!doc.has(key)) {
      doc.set(key, doc.createNode({}));
      context.logMutation(`added ${key} to pnpm-workspace.yaml`);
      modified = true;
    }

    const mapNode = doc.get(key, true);
    if (!isMap(mapNode)) {
      continue;
    }

    for (const [subKey, defaultVal] of Object.entries(defaultObj)) {
      if (syncObjectPair(mapNode, key, subKey, defaultVal, context)) {
        modified = true;
      }
    }

    if (cleanRetiredObjectKeys(mapNode, key, defaultObj, context)) {
      modified = true;
    }
  }

  return modified;
};

const deduplicateArrayItems = (
  seqNode: YAMLSeq,
  key: string,
  context: SyncContext,
): boolean => {
  const seenValues = new Map<string, number>();
  const deduplicatedItems: typeof seqNode.items = [];
  let modified = false;

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
        context.logMutation(
          `removed duplicate ${item.value} from ${key} in pnpm-workspace.yaml`,
        );
        modified = true;
        continue;
      }
      seenValues.set(item.value, deduplicatedItems.length);
      deduplicatedItems.push(item);
    } else {
      deduplicatedItems.push(item);
    }
  }

  seqNode.items = deduplicatedItems;
  return modified;
};

const processSingleArrayItem = (
  item: unknown,
  defaultList: readonly string[],
  explanatory: string | undefined,
  key: string,
  context: SyncContext,
): { modified: boolean; remove: boolean } => {
  if (!isScalar(item) || typeof item.value !== 'string') {
    return { modified: false, remove: false };
  }

  const val = item.value;
  if (defaultList.includes(val)) {
    if (setManagedComment(item, explanatory)) {
      context.logMutation(`adopted ${val} in ${key} in pnpm-workspace.yaml`);
      return { modified: true, remove: false };
    }
    return { modified: false, remove: false };
  }

  const isMarked = hasManagedMarker(item.comment);
  if (isMarked) {
    if (context.mode === 'enforce') {
      return { modified: true, remove: true };
    }
    context.warn(
      `pnpm-workspace.yaml: "${val}" in ${key} is marked with "${MANAGED_BY_SKU_COMMENT}", but is no longer a sku default. Run "sku configure" to remove it, or delete its "${MANAGED_BY_SKU_COMMENT}" marker to keep it as a user-managed entry.`,
    );
  }

  return { modified: false, remove: false };
};

const processExistingArrayItems = (
  seqNode: YAMLSeq,
  defaultList: readonly string[],
  explanatoryMap: Record<string, string> | undefined,
  key: string,
  context: SyncContext,
): boolean => {
  let modified = false;
  const indicesToRemove: number[] = [];

  for (let i = 0; i < seqNode.items.length; i++) {
    const item = seqNode.items[i];
    const val =
      isScalar(item) && typeof item.value === 'string' ? item.value : undefined;
    const explanatory = val ? explanatoryMap?.[val] : undefined;
    const result = processSingleArrayItem(
      item,
      defaultList,
      explanatory,
      key,
      context,
    );
    if (result.modified) {
      modified = true;
    }
    if (result.remove) {
      indicesToRemove.push(i);
    }
  }

  for (let i = indicesToRemove.length - 1; i >= 0; i--) {
    const idx = indicesToRemove[i];
    const item = seqNode.items[idx];
    const val = isScalar(item) ? String(item.value) : '';
    seqNode.items.splice(idx, 1);
    context.logMutation(
      `removed retired entry ${val} from ${key} in pnpm-workspace.yaml`,
    );
  }

  return modified;
};

const appendMissingArrayDefaults = (
  seqNode: YAMLSeq,
  defaultList: readonly string[],
  explanatoryMap: Record<string, string> | undefined,
  key: string,
  context: SyncContext,
): boolean => {
  let modified = false;
  const existingValues = new Set<string>();

  for (const item of seqNode.items) {
    if (isScalar(item) && typeof item.value === 'string') {
      existingValues.add(item.value);
    }
  }

  for (const defaultItem of defaultList) {
    if (!existingValues.has(defaultItem)) {
      const explanatory = explanatoryMap?.[defaultItem];
      const newItem = context.doc.createNode(defaultItem);
      setManagedComment(newItem, explanatory);
      seqNode.items.push(newItem);
      existingValues.add(defaultItem);
      context.logMutation(
        `added ${defaultItem} to ${key} in pnpm-workspace.yaml`,
      );
      modified = true;
    }
  }

  return modified;
};

const syncArraySettings = (context: SyncContext): boolean => {
  let modified = false;

  for (const key of arraySettings) {
    const defaultList = defaultPnpmWorkspaceConfig[key] as readonly string[];
    const explanatoryMap = getExplanatoryComments(key);

    if (!context.doc.has(key)) {
      context.doc.set(key, context.doc.createNode([]));
      context.logMutation(`added ${key} to pnpm-workspace.yaml`);
      modified = true;
    }

    const seqNode = context.doc.get(key, true);
    if (!isSeq(seqNode)) {
      continue;
    }

    if (deduplicateArrayItems(seqNode, key, context)) {
      modified = true;
    }
    if (
      processExistingArrayItems(
        seqNode,
        defaultList,
        explanatoryMap,
        key,
        context,
      )
    ) {
      modified = true;
    }
    if (
      appendMissingArrayDefaults(
        seqNode,
        defaultList,
        explanatoryMap,
        key,
        context,
      )
    ) {
      modified = true;
    }
  }

  return modified;
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

  let modified = !fileExisted;

  const logMutation: LogMutation = (message) => console.log(message);

  if (!fileExisted) {
    logMutation('created pnpm-workspace.yaml');
  }

  const warn: Warn = (message) => {
    console.warn(caution(message));
  };

  const context: SyncContext = { doc, mode, logMutation, warn };

  if (migrateConfigDependencies(doc, logMutation)) {
    modified = true;
  }
  if (syncSingleValueSettings(context)) {
    modified = true;
  }
  if (syncObjectSettings(context)) {
    modified = true;
  }
  if (syncArraySettings(context)) {
    modified = true;
  }

  if (modified) {
    const newContent = doc.toString();
    if (newContent !== originalContent) {
      await writeFile(filePath, newContent, 'utf-8');
    }
  }
}
