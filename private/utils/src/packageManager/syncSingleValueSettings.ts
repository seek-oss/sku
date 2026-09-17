import { isMap, type Document } from 'yaml';
import {
  pnpmWorkspaceSettings,
  singleValueSettings,
} from './pnpmWorkspaceDefaults.ts';
import {
  checkManagedScalar,
  checkMessage,
  clearDocKeyComment,
  createManagedNode,
  getNodeKey,
  isManaged,
  pnpmWorkspaceFileName,
  scalarValue,
  setManagedComment,
  settingSubject,
  type CheckContext,
  type SyncContext,
} from './syncShared.ts';

type SingleValueSetting = (typeof singleValueSettings)[number];

/** Top-level keys that still carry the managed marker but are no longer sku defaults. */
const findRetiredSingleValueKeys = (doc: Document): string[] => {
  if (!isMap(doc.contents)) {
    return [];
  }

  return doc.contents.items
    .filter((pair) => isManaged(pair.value))
    .map((pair) => getNodeKey(pair.key))
    .filter((key) => !(key in pnpmWorkspaceSettings));
};

export const checkSingleValueSettings = (context: CheckContext): void => {
  const { doc, failures } = context;

  for (const { key, value: defaultValue } of singleValueSettings) {
    if (!doc.has(key)) {
      failures.push(
        checkMessage.missingWithDefault(settingSubject(key), defaultValue),
      );
      continue;
    }

    checkManagedScalar(context, {
      subject: settingSubject(key),
      node: doc.get(key, true),
      defaultValue,
    });
  }

  for (const key of findRetiredSingleValueKeys(doc)) {
    failures.push(checkMessage.retiredMarker(settingSubject(key)));
  }
};

const syncSingleValue = (
  { key, value: defaultValue, comment }: SingleValueSetting,
  context: SyncContext,
): void => {
  const { doc, recordMutation } = context;

  if (!doc.has(key)) {
    doc.set(key, createManagedNode(doc, defaultValue, comment));
    recordMutation(`added ${key}: ${defaultValue} to ${pnpmWorkspaceFileName}`);
    return;
  }

  const node = doc.get(key, true);
  const currentValue = scalarValue(node);

  if (currentValue === defaultValue) {
    // Only reachable for scalars, since a collection never equals a primitive.
    // Both comment sites must be cleared, so neither call may be short-circuited.
    const markerAdded = setManagedComment(node, comment);
    const leadingCommentCleared = clearDocKeyComment(doc, key);

    if (markerAdded || leadingCommentCleared) {
      recordMutation(
        `adopted ${key}: ${String(currentValue)} in ${pnpmWorkspaceFileName}`,
      );
    }
    return;
  }

  if (!isManaged(node)) {
    return;
  }

  doc.set(key, createManagedNode(doc, defaultValue, comment));
  clearDocKeyComment(doc, key);
  recordMutation(
    `updated ${key}: ${String(currentValue)} → ${defaultValue} in ${pnpmWorkspaceFileName}`,
  );
};

export const syncSingleValueSettings = (context: SyncContext): void => {
  const { doc, recordMutation } = context;

  for (const setting of singleValueSettings) {
    syncSingleValue(setting, context);
  }

  for (const key of findRetiredSingleValueKeys(doc)) {
    doc.delete(key);
    recordMutation(
      `removed retired entry ${key} from ${pnpmWorkspaceFileName}`,
    );
  }
};
