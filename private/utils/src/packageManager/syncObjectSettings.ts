import { isMap, isScalar, type YAMLMap } from 'yaml';
import { objectSettings } from './pnpmWorkspaceDefaults.ts';
import {
  checkManagedScalar,
  checkMessage,
  clearCommentBefore,
  createManagedNode,
  ensureMap,
  entrySubject,
  findPair,
  getNodeKey,
  isManaged,
  pnpmWorkspaceFileName,
  setManagedComment,
  settingSubject,
  type CheckContext,
  type SyncContext,
} from './syncShared.ts';

type ObjectEntries = Readonly<Record<string, boolean>>;

export const checkObjectSettings = (context: CheckContext): void => {
  const { doc, failures } = context;

  for (const { key, entries } of objectSettings) {
    if (!doc.has(key)) {
      failures.push(checkMessage.missing(settingSubject(key)));
      continue;
    }

    const mapNode = doc.get(key, true);
    if (!isMap(mapNode)) {
      continue;
    }

    for (const [subKey, defaultValue] of Object.entries(entries)) {
      const pair = findPair(mapNode, subKey);
      const subject = settingSubject(`${key}.${subKey}`);

      if (!pair) {
        failures.push(checkMessage.missingWithDefault(subject, defaultValue));
        continue;
      }

      if (isScalar(pair.value)) {
        checkManagedScalar(context, {
          subject,
          node: pair.value,
          defaultValue,
        });
      }
    }

    for (const pair of mapNode.items) {
      const subKey = getNodeKey(pair.key);
      if (!(subKey in entries) && isManaged(pair.value)) {
        failures.push(checkMessage.retiredMarker(entrySubject(subKey, key)));
      }
    }
  }
};

const syncObjectPair = (
  mapNode: YAMLMap,
  key: string,
  subKey: string,
  defaultValue: boolean,
  context: SyncContext,
): void => {
  const { doc, recordMutation } = context;
  const pair = findPair(mapNode, subKey);

  if (!pair) {
    mapNode.set(subKey, createManagedNode(doc, defaultValue));
    recordMutation(
      `added ${key}.${subKey}: ${defaultValue} to ${pnpmWorkspaceFileName}`,
    );
    return;
  }

  if (!isScalar(pair.value)) {
    return;
  }

  const currentValue = pair.value.value;

  if (currentValue === defaultValue) {
    // Both comment sites must be cleared, so neither call may be short-circuited.
    const markerAdded = setManagedComment(pair.value);
    const leadingCommentCleared = clearCommentBefore(pair.key);

    if (markerAdded || leadingCommentCleared) {
      recordMutation(
        `adopted ${key}.${subKey}: ${String(currentValue)} in ${pnpmWorkspaceFileName}`,
      );
    }
    return;
  }

  if (!isManaged(pair.value)) {
    return;
  }

  pair.value = createManagedNode(doc, defaultValue);
  clearCommentBefore(pair.key);
  recordMutation(
    `updated ${key}.${subKey}: ${String(currentValue)} → ${defaultValue} in ${pnpmWorkspaceFileName}`,
  );
};

const removeRetiredObjectKeys = (
  mapNode: YAMLMap,
  key: string,
  entries: ObjectEntries,
  context: SyncContext,
): void => {
  mapNode.items = mapNode.items.filter((pair) => {
    const subKey = getNodeKey(pair.key);
    if (subKey in entries || !isManaged(pair.value)) {
      return true;
    }

    context.recordMutation(
      `removed retired entry ${key}.${subKey} from ${pnpmWorkspaceFileName}`,
    );
    return false;
  });
};

export const syncObjectSettings = (context: SyncContext): void => {
  for (const { key, entries } of objectSettings) {
    const mapNode = ensureMap(context, key);
    if (!mapNode) {
      continue;
    }

    for (const [subKey, defaultValue] of Object.entries(entries)) {
      syncObjectPair(mapNode, key, subKey, defaultValue, context);
    }

    removeRetiredObjectKeys(mapNode, key, entries, context);
  }
};
