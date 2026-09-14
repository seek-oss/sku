import { isMap, isPair, isSeq, type Document } from 'yaml';
import {
  getNodeKey,
  type CheckContext,
  type SyncContext,
} from './syncShared.ts';

const CONFIG_DEPENDENCIES_KEY = 'configDependencies';
const PNPM_PLUGIN_SKU = 'pnpm-plugin-sku';

const getConfigDependencies = (doc: Document) => {
  if (!doc.has(CONFIG_DEPENDENCIES_KEY)) {
    return undefined;
  }

  const node = doc.get(CONFIG_DEPENDENCIES_KEY, true);
  return isMap(node) || isSeq(node) ? node : undefined;
};

const isPluginSkuEntry = (item: unknown): boolean =>
  getNodeKey(isPair(item) ? item.key : item) === PNPM_PLUGIN_SKU;

export const checkPnpmPluginSku = (context: CheckContext): void => {
  const configDependencies = getConfigDependencies(context.doc);

  if (!configDependencies) {
    return;
  }

  const items: unknown[] = configDependencies.items;
  if (items.some(isPluginSkuEntry)) {
    context.failures.push(
      'pnpm-workspace.yaml: "pnpm-plugin-sku" is present in configDependencies.',
    );
  }
};

/**
 * Removes the pnpm-plugin-sku from the configDependencies in pnpm-workspace.yaml
 */
export const removePnpmPluginSku = (context: SyncContext): void => {
  const { doc, recordMutation } = context;

  const configDependencies = getConfigDependencies(doc);

  if (!configDependencies) {
    return;
  }

  const items: unknown[] = configDependencies.items;
  const remainingItems = items.filter((item) => !isPluginSkuEntry(item));

  if (remainingItems.length === items.length) {
    return;
  }

  configDependencies.items = remainingItems as typeof configDependencies.items;
  recordMutation(
    'removed pnpm-plugin-sku from configDependencies in pnpm-workspace.yaml',
  );

  if (remainingItems.length === 0) {
    doc.delete(CONFIG_DEPENDENCIES_KEY);
  }
};
