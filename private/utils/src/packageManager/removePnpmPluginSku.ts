import { isMap, isPair, isSeq, type Document } from 'yaml';
import {
  getNodeKey,
  pnpmWorkspaceFileName,
  type CheckContext,
  type SyncContext,
} from './syncShared.ts';

const CONFIG_DEPENDENCIES_KEY = 'configDependencies';
const PNPM_PLUGIN_SKU = 'pnpm-plugin-sku';

/** `configDependencies` accepts either a map of versions or a plain sequence. */
const getConfigDependencies = (doc: Document) => {
  const node = doc.get(CONFIG_DEPENDENCIES_KEY, true);
  return isMap(node) || isSeq(node) ? node : undefined;
};

const isPluginSkuEntry = (item: unknown): boolean =>
  getNodeKey(isPair(item) ? item.key : item) === PNPM_PLUGIN_SKU;

export const checkPnpmPluginSku = (context: CheckContext): void => {
  const items: unknown[] = getConfigDependencies(context.doc)?.items ?? [];

  if (items.some(isPluginSkuEntry)) {
    context.failures.push(
      `${pnpmWorkspaceFileName}: "${PNPM_PLUGIN_SKU}" is present in ${CONFIG_DEPENDENCIES_KEY}.`,
    );
  }
};

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

  // Replaced in place: `items` is typed per collection kind, so the narrowed
  // union cannot be reassigned without a cast.
  items.splice(0, items.length, ...remainingItems);

  recordMutation(
    `removed ${PNPM_PLUGIN_SKU} from ${CONFIG_DEPENDENCIES_KEY} in ${pnpmWorkspaceFileName}`,
  );

  if (remainingItems.length === 0) {
    doc.delete(CONFIG_DEPENDENCIES_KEY);
  }
};
