import { isMap, isScalar, type YAMLMap } from 'yaml';
import {
  MANAGED_BY_SKU_COMMENT,
  objectSettings,
} from './pnpmWorkspaceDefaults.ts';
import {
  clearCommentBefore,
  getNodeKey,
  hasManagedMarker,
  setManagedComment,
  type SyncContext,
} from './syncShared.ts';

const markPairAsManaged = (
  pair: { key: unknown; value: unknown },
  explanatory?: string,
): boolean => {
  const modified = setManagedComment(pair.value, explanatory);
  return clearCommentBefore(pair.key) || modified;
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

export const syncObjectSettings = (context: SyncContext): void => {
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
