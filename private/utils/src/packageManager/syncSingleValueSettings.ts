import { isMap, isScalar, type Document } from 'yaml';
import { singleValueSettings } from './pnpmWorkspaceDefaults.ts';
import {
  clearCommentBefore,
  getNodeKey,
  setManagedComment,
  type SyncContext,
} from './syncShared.ts';

const findMapPair = (doc: Document, key: string) => {
  if (!isMap(doc.contents)) {
    return undefined;
  }

  return doc.contents.items.find((pair) => getNodeKey(pair.key) === key);
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

export const syncSingleValueSettings = (context: SyncContext): void => {
  for (const setting of singleValueSettings) {
    syncSingleValue(setting, context);
  }
};
