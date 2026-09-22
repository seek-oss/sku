import { isSeq, type YAMLSeq } from 'yaml';
import { arraySettings } from './pnpmWorkspaceDefaults.ts';
import {
  checkMessage,
  createManagedNode,
  ensureSeq,
  entrySubject,
  isManaged,
  isStringScalar,
  nodeKind,
  pnpmWorkspaceFileName,
  setManagedComment,
  settingSubject,
  type CheckContext,
  type SyncContext,
} from './syncShared.ts';

/** Default entries per array setting, as sets for membership tests during check and sync. */
const arrayDefaults = arraySettings.map(({ key, entries }) => ({
  key,
  defaults: new Set(entries),
}));

export const checkArraySettings = (context: CheckContext): void => {
  const { doc, failures } = context;

  for (const { key, defaults } of arrayDefaults) {
    if (!doc.has(key)) {
      failures.push(checkMessage.missing(settingSubject(key)));
      continue;
    }

    const seqNode = doc.get(key, true);
    if (!isSeq(seqNode)) {
      failures.push(
        checkMessage.kindMismatch(
          settingSubject(key),
          'a list',
          nodeKind(seqNode),
        ),
      );
      continue;
    }

    const seenValues = new Set<string>();

    for (const item of seqNode.items) {
      if (!isStringScalar(item)) {
        continue;
      }

      const { value } = item;
      if (seenValues.has(value)) {
        failures.push(
          `${pnpmWorkspaceFileName}: duplicate "${value}" in ${key}.`,
        );
      }
      seenValues.add(value);

      if (defaults.has(value)) {
        if (!isManaged(item)) {
          failures.push(checkMessage.missingMarker(entrySubject(value, key)));
        }
      } else if (isManaged(item)) {
        failures.push(checkMessage.retiredMarker(entrySubject(value, key)));
      }
    }

    for (const value of defaults) {
      if (!seenValues.has(value)) {
        failures.push(checkMessage.missing(entrySubject(value, key)));
      }
    }
  }
};

const dedupeEntries = (
  seqNode: YAMLSeq,
  key: string,
  context: SyncContext,
): void => {
  const indexByValue = new Map<string, number>();
  const kept: unknown[] = [];

  for (const item of seqNode.items) {
    if (!isStringScalar(item)) {
      kept.push(item);
      continue;
    }

    const existingIndex = indexByValue.get(item.value);
    if (existingIndex === undefined) {
      indexByValue.set(item.value, kept.length);
      kept.push(item);
      continue;
    }

    // Keep the user's copy over sku's so that retiring a default drops the
    // marked entry rather than the value the user asked for.
    if (isManaged(kept[existingIndex]) && !isManaged(item)) {
      kept[existingIndex] = item;
    }

    context.recordMutation(`removed duplicate ${item.value} from ${key}`);
  }

  seqNode.items = kept;
};

/** Adopts entries that are sku defaults and drops marked entries that no longer are. */
const adoptAndRetireEntries = (
  seqNode: YAMLSeq,
  key: string,
  defaults: ReadonlySet<string>,
  context: SyncContext,
): void => {
  seqNode.items = seqNode.items.filter((item) => {
    if (!isStringScalar(item)) {
      return true;
    }

    const { value } = item;
    if (defaults.has(value)) {
      if (setManagedComment(item)) {
        context.recordMutation(`adopted ${value} in ${key}`);
      }
      return true;
    }

    if (!isManaged(item)) {
      return true;
    }

    context.recordMutation(`removed retired entry ${value} from ${key}`);
    return false;
  });
};

const appendMissingDefaults = (
  seqNode: YAMLSeq,
  key: string,
  defaults: ReadonlySet<string>,
  context: SyncContext,
): void => {
  const existingValues = new Set(
    seqNode.items.filter(isStringScalar).map((item) => item.value),
  );

  for (const value of defaults) {
    if (existingValues.has(value)) {
      continue;
    }

    seqNode.items.push(createManagedNode(context.doc, value));
    context.recordMutation(`added ${value} to ${key}`);
  }
};

export const syncArraySettings = (context: SyncContext): void => {
  for (const { key, defaults } of arrayDefaults) {
    const seqNode = ensureSeq(context, key);
    if (!seqNode) {
      continue;
    }

    dedupeEntries(seqNode, key, context);
    adoptAndRetireEntries(seqNode, key, defaults, context);
    appendMissingDefaults(seqNode, key, defaults, context);
  }
};
