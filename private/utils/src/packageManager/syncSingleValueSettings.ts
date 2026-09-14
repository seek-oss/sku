import { isScalar } from 'yaml';
import { singleValueSettings } from './pnpmWorkspaceDefaults.ts';
import {
  clearDocKeyComment,
  createManagedNode,
  hasManagedMarker,
  setManagedComment,
  type CheckContext,
  type SyncContext,
} from './syncShared.ts';

export const checkSingleValueSettings = (context: CheckContext): void => {
  const { doc, failures, advisories } = context;

  for (const { key, value: defaultValue } of singleValueSettings) {
    if (!doc.has(key)) {
      failures.push(
        `pnpm-workspace.yaml: "${key}" is missing, recommended is ${defaultValue}.`,
      );
      continue;
    }

    const node = doc.get(key, true);
    const currentValue = isScalar(node) ? node.value : doc.get(key);
    const isMarked = isScalar(node) && hasManagedMarker(node.comment);

    if (isMarked) {
      if (currentValue !== defaultValue) {
        failures.push(
          `pnpm-workspace.yaml: "${key}" has value ${String(currentValue)}, recommended is ${defaultValue}.`,
        );
      }
    } else if (currentValue === defaultValue) {
      failures.push(
        `pnpm-workspace.yaml: "${key}" matches sku's default but is missing the "[sku_managed]" marker.`,
      );
    } else {
      advisories.push(
        `pnpm-workspace.yaml: "${key}" has value ${String(currentValue)}, recommended is ${defaultValue}. To re-align, edit the value to match sku's default, or delete it and run "sku format" to re-add it as sku-managed.`,
      );
    }
  }
};

const handleMatchingSingleValue = (
  node: unknown,
  explanatory: string | undefined,
  currentValue: unknown,
  key: string,
  context: SyncContext,
): void => {
  const { doc, recordMutation } = context;

  if (isScalar(node)) {
    const modified = setManagedComment(node, explanatory);
    const cleared = clearDocKeyComment(doc, key);
    if (modified || cleared) {
      recordMutation(
        `adopted ${key}: ${String(currentValue)} in pnpm-workspace.yaml`,
      );
    }
    return;
  }

  doc.set(key, createManagedNode(doc, currentValue, explanatory));
  recordMutation(
    `adopted ${key}: ${String(currentValue)} in pnpm-workspace.yaml`,
  );
};

const updateExistingSingleValue = (
  key: string,
  defaultValue: string | number | boolean,
  explanatory: string | undefined,
  context: SyncContext,
): void => {
  const { doc, recordMutation } = context;
  const node = doc.get(key, true);
  const currentValue = isScalar(node) ? node.value : doc.get(key);

  if (currentValue === defaultValue) {
    handleMatchingSingleValue(node, explanatory, currentValue, key, context);
    return;
  }

  const isMarked = isScalar(node) && hasManagedMarker(node.comment);
  if (isMarked) {
    doc.set(key, createManagedNode(doc, defaultValue, explanatory));
    clearDocKeyComment(doc, key);
    recordMutation(
      `updated ${key}: ${String(currentValue)} → ${defaultValue} in pnpm-workspace.yaml`,
    );
  }
};

export const syncSingleValueSettings = (context: SyncContext): void => {
  const { doc, recordMutation } = context;

  for (const { key, value: defaultValue, comment } of singleValueSettings) {
    if (!doc.has(key)) {
      doc.set(key, createManagedNode(doc, defaultValue, comment));
      recordMutation(`added ${key}: ${defaultValue} to pnpm-workspace.yaml`);
      continue;
    }

    updateExistingSingleValue(key, defaultValue, comment, context);
  }
};
