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
  objectSettings,
  singleValueSettings,
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

const isKnownExplanatoryComment = (
  comment: string,
  explanatory?: string,
): boolean => {
  if (!explanatory) {
    return false;
  }
  const cleanExp = explanatory.replace(/^#\s*/, '').trim();
  const cleanComment = comment.replace(/^#\s*/, '').trim();
  return cleanComment === cleanExp;
};

const hasUserComment = (
  comment?: string | null,
  explanatory?: string,
): boolean => {
  if (!comment) {
    return false;
  }
  const trimmed = comment.trim();
  if (!trimmed) {
    return false;
  }
  if (trimmed.includes(MANAGED_BY_SKU_MARKER)) {
    return false;
  }
  if (isKnownExplanatoryComment(trimmed, explanatory)) {
    return false;
  }
  return true;
};

const formatComment = (explanatory?: string): string => {
  if (!explanatory) {
    return ` ${MANAGED_BY_SKU_MARKER}`;
  }
  const cleanExp = explanatory.replace(/^#\s*/, '').trim();
  return ` ${cleanExp} # ${MANAGED_BY_SKU_MARKER}`;
};

const migrateConfigDependencies = (
  doc: Document,
  logMutation: LogMutation,
): boolean => {
  if (!doc.has('configDependencies')) {
    return false;
  }

  let modified = false;
  const cd = doc.get('configDependencies', true);

  if (isMap(cd)) {
    if (cd.has('pnpm-plugin-sku')) {
      cd.delete('pnpm-plugin-sku');
      logMutation(
        'removed pnpm-plugin-sku from configDependencies in pnpm-workspace.yaml',
      );
      modified = true;
    }
    if (cd.items.length === 0) {
      doc.delete('configDependencies');
      modified = true;
    }
  } else if (isSeq(cd)) {
    const idx = cd.items.findIndex(
      (item) => isScalar(item) && item.value === 'pnpm-plugin-sku',
    );
    if (idx !== -1) {
      cd.items.splice(idx, 1);
      logMutation(
        'removed pnpm-plugin-sku from configDependencies in pnpm-workspace.yaml',
      );
      modified = true;
    }
    if (cd.items.length === 0) {
      doc.delete('configDependencies');
      modified = true;
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
): boolean => {
  if (isScalar(node)) {
    if (
      !hasUserComment(node.comment, explanatory) &&
      !node.comment?.includes(MANAGED_BY_SKU_MARKER)
    ) {
      node.comment = formatComment(explanatory);
      return true;
    }
    return false;
  }

  const wrapped = doc.createNode(currentValue);
  if (isScalar(wrapped)) {
    wrapped.comment = formatComment(explanatory);
  }
  doc.set(key, wrapped);
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
    return handleMatchingSingleValue(node, explanatory, currentValue, doc, key);
  }

  if (mode === 'enforce') {
    const oldComment = node && isScalar(node) ? node.comment : undefined;
    const updatedNode = doc.createNode(defaultValue);
    if (isScalar(updatedNode)) {
      updatedNode.comment = hasUserComment(oldComment, explanatory)
        ? oldComment
        : formatComment(explanatory);
    }
    doc.set(key, updatedNode);
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
  const explanatory = (
    explanatoryComments as unknown as Record<string, string | undefined>
  )[key];

  if (!doc.has(key)) {
    const node = doc.createNode(defaultValue);
    if (isScalar(node)) {
      node.comment = formatComment(explanatory);
    }
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
    pair.value = doc.createNode(pair.value);
  }
  if (!isScalar(pair.value)) {
    return false;
  }

  const currentVal = pair.value.value;
  if (currentVal === defaultVal) {
    if (
      !hasUserComment(pair.value.comment) &&
      !pair.value.comment?.includes(MANAGED_BY_SKU_MARKER)
    ) {
      pair.value.comment = formatComment();
      return true;
    }
    return false;
  }

  if (mode === 'enforce') {
    const oldComment = pair.value.comment;
    pair.value = doc.createNode(defaultVal);
    if (isScalar(pair.value)) {
      pair.value.comment = hasUserComment(oldComment)
        ? oldComment
        : formatComment();
    }
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
  const pair = mapNode.items.find((item) =>
    isScalar(item.key)
      ? String(item.key.value) === subKey
      : String(item.key) === subKey,
  );

  if (!pair) {
    const valNode = context.doc.createNode(defaultVal);
    if (isScalar(valNode)) {
      valNode.comment = formatComment();
    }
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
    const subKey = isScalar(pair.key)
      ? String(pair.key.value)
      : String(pair.key);
    if (!(subKey in defaultObj)) {
      const isMarked =
        isScalar(pair.value) &&
        pair.value.comment?.includes(MANAGED_BY_SKU_MARKER);
      if (isMarked) {
        if (mode === 'enforce') {
          itemsToRemove.push(subKey);
        } else {
          warn(
            `pnpm-workspace.yaml: "${subKey}" in ${key} is marked as managed by sku, but is no longer a sku default. Run "sku configure" to remove it, or delete its "# managed by sku" marker to keep it as a user-managed entry.`,
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

const deduplicateArrayItems = (seqNode: YAMLSeq): boolean => {
  const seenValues = new Set<string>();
  const deduplicatedItems: typeof seqNode.items = [];
  let modified = false;

  for (const item of seqNode.items) {
    if (isScalar(item) && typeof item.value === 'string') {
      if (seenValues.has(item.value)) {
        modified = true;
        continue;
      }
      seenValues.add(item.value);
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
    if (
      !hasUserComment(item.comment, explanatory) &&
      !item.comment?.includes(MANAGED_BY_SKU_MARKER)
    ) {
      item.comment = formatComment(explanatory);
      return { modified: true, remove: false };
    }
    return { modified: false, remove: false };
  }

  const isMarked = item.comment?.includes(MANAGED_BY_SKU_MARKER);
  if (isMarked) {
    if (context.mode === 'enforce') {
      return { modified: true, remove: true };
    }
    context.warn(
      `pnpm-workspace.yaml: "${val}" in ${key} is marked as managed by sku, but is no longer a sku default. Run "sku configure" to remove it, or delete its "# managed by sku" marker to keep it as a user-managed entry.`,
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
      if (isScalar(newItem)) {
        newItem.comment = formatComment(explanatory);
      }
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
    const explanatoryMap = (explanatoryComments as Record<string, any>)[key] as
      Record<string, string> | undefined;

    if (!context.doc.has(key)) {
      context.doc.set(key, context.doc.createNode([]));
      modified = true;
    }

    const seqNode = context.doc.get(key, true);
    if (!isSeq(seqNode)) {
      continue;
    }

    if (deduplicateArrayItems(seqNode)) {
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
  targetDirOrOptions?: string | EnsurePnpmWorkspaceConfigOptions,
  maybeOptions?: EnsurePnpmWorkspaceConfigOptions,
): Promise<void> {
  const options =
    typeof targetDirOrOptions === 'string'
      ? { targetDir: targetDirOrOptions, ...maybeOptions }
      : { ...targetDirOrOptions };

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
    if (!doc.contents || !isMap(doc.contents)) {
      doc.contents = doc.createNode({});
    }
  } else {
    doc = new Document(structuredClone(defaultPnpmWorkspaceConfig));
  }

  let modified = !fileExisted;

  const logMutation: LogMutation = (message) => {
    if (fileExisted) {
      console.log(message);
    }
  };

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
