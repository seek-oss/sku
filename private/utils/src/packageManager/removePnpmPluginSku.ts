import { isMap, isPair, isSeq, type Document } from 'yaml';
import { getNodeKey, type RecordMutation } from './syncShared.ts';

/**
 * Removes the pnpm-plugin-sku from the configDependencies in pnpm-workspace.yaml
 */
export const removePnpmPluginSku = (
  doc: Document,
  recordMutation: RecordMutation,
): void => {
  if (!doc.has('configDependencies')) {
    return;
  }

  const cd = doc.get('configDependencies', true);

  if (!isMap(cd) && !isSeq(cd)) {
    return;
  }

  const items: unknown[] = cd.items;
  const remainingItems = items.filter(
    (item) => getNodeKey(isPair(item) ? item.key : item) !== 'pnpm-plugin-sku',
  );

  if (remainingItems.length === items.length) {
    return;
  }

  cd.items = remainingItems as typeof cd.items;
  recordMutation(
    'removed pnpm-plugin-sku from configDependencies in pnpm-workspace.yaml',
  );

  if (remainingItems.length === 0) {
    doc.delete('configDependencies');
  }
};
