import { isMap, isScalar, type YAMLMap } from 'yaml';
import {
  MANAGED_BY_SKU_MARKER,
  objectSettings,
} from './pnpmWorkspaceDefaults.ts';
import {
  clearCommentBefore,
  createManagedNode,
  ensureCollection,
  findPair,
  getNodeKey,
  hasManagedMarker,
  setManagedComment,
  type CheckContext,
  type SyncContext,
} from './syncShared.ts';

export const checkObjectSettings = (context: CheckContext): void => {
  const { doc, failures, advisories } = context;

  for (const { key, entries } of objectSettings) {
    if (!doc.has(key)) {
      failures.push(`pnpm-workspace.yaml: "${key}" is missing.`);
      continue;
    }

    const mapNode = doc.get(key, true);
    if (!isMap(mapNode)) {
      continue;
    }

    for (const [subKey, defaultVal] of Object.entries(entries)) {
      const pair = findPair(mapNode, subKey);

      if (!pair) {
        failures.push(
          `pnpm-workspace.yaml: "${key}.${subKey}" is missing, recommended is ${defaultVal}.`,
        );
        continue;
      }

      if (!isScalar(pair.value)) {
        continue;
      }

      const currentVal = pair.value.value;
      const isMarked = hasManagedMarker(pair.value.comment);

      if (isMarked) {
        if (currentVal !== defaultVal) {
          failures.push(
            `pnpm-workspace.yaml: "${key}.${subKey}" has value ${String(currentVal)}, recommended is ${defaultVal}.`,
          );
        }
      } else if (currentVal === defaultVal) {
        failures.push(
          `pnpm-workspace.yaml: "${key}.${subKey}" matches sku's default but is missing the "[sku_managed]" marker.`,
        );
      } else {
        advisories.push(
          `pnpm-workspace.yaml: "${key}.${subKey}" has value ${String(currentVal)}, recommended is ${defaultVal}. To re-align, edit the value to match sku's default, or delete it and run "sku format" to re-add it as sku-managed.`,
        );
      }
    }

    for (const pair of mapNode.items) {
      const subKey = getNodeKey(pair.key);
      if (!(subKey in entries)) {
        const isMarked =
          isScalar(pair.value) && hasManagedMarker(pair.value.comment);
        if (isMarked) {
          failures.push(
            `pnpm-workspace.yaml: "${subKey}" in ${key} is marked with "${MANAGED_BY_SKU_MARKER}", but is no longer a sku default. Delete its "${MANAGED_BY_SKU_MARKER}" marker to keep it as a user-managed entry.`,
          );
        }
      }
    }
  }
};

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
  const { doc, recordMutation } = context;

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

  pair.value = createManagedNode(doc, defaultVal);
  clearCommentBefore(pair.key);
  recordMutation(
    `updated ${key}.${subKey}: ${String(currentVal)} → ${defaultVal} in pnpm-workspace.yaml`,
  );
};

const syncObjectPair = (
  mapNode: YAMLMap,
  key: string,
  subKey: string,
  defaultVal: boolean,
  context: SyncContext,
): void => {
  const pair = findPair(mapNode, subKey);

  if (!pair) {
    mapNode.set(subKey, createManagedNode(context.doc, defaultVal));
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
  const { recordMutation } = context;
  const itemsToRemove: string[] = [];
  for (const pair of mapNode.items) {
    const subKey = getNodeKey(pair.key);
    if (!(subKey in defaultObj)) {
      const isMarked =
        isScalar(pair.value) && hasManagedMarker(pair.value.comment);
      if (isMarked) {
        itemsToRemove.push(subKey);
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
  for (const { key, entries } of objectSettings) {
    const mapNode = ensureCollection(context, key, 'object');
    if (!mapNode) {
      continue;
    }

    for (const [subKey, defaultVal] of Object.entries(entries)) {
      syncObjectPair(mapNode, key, subKey, defaultVal, context);
    }

    cleanRetiredObjectKeys(mapNode, key, entries, context);
  }
};
