import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Document, isMap, parseDocument } from 'yaml';
import { caution } from '../console/styles.ts';
import { removePnpmPluginSku } from './removePnpmPluginSku.ts';
import { rootDir } from './packageManager.ts';
import { defaultPnpmWorkspaceConfig } from './pnpmWorkspaceDefaults.ts';
import { syncArraySettings } from './syncArraySettings.ts';
import { syncObjectSettings } from './syncObjectSettings.ts';
import type {
  RecordMutation,
  SyncContext,
  SyncMode,
  Warn,
} from './syncShared.ts';
import { syncSingleValueSettings } from './syncSingleValueSettings.ts';

export type { SyncMode } from './syncShared.ts';

export interface EnsurePnpmWorkspaceConfigOptions {
  targetDir?: string;
  mode?: SyncMode;
  create?: boolean;
}

export async function ensurePnpmWorkspaceConfig({
  mode = 'additive',
  create = false,
  targetDir = rootDir ?? process.cwd(),
}: EnsurePnpmWorkspaceConfigOptions = {}): Promise<void> {
  const filePath = join(targetDir, 'pnpm-workspace.yaml');
  const fileExisted = existsSync(filePath);

  if (!fileExisted && !create) {
    return;
  }

  let originalContent = '';
  let doc: Document;

  if (fileExisted) {
    originalContent = await readFile(filePath, 'utf-8');
    doc = parseDocument(originalContent);
    if (!doc.contents) {
      doc.contents = doc.createNode({});
    } else if (!isMap(doc.contents)) {
      throw new Error(
        `Cannot sync ${filePath}: the document must contain a YAML mapping`,
      );
    }
  } else {
    doc = new Document(structuredClone(defaultPnpmWorkspaceConfig));
  }

  let modified = false;

  const recordMutation: RecordMutation = (message) => {
    modified = true;
    console.log(message);
  };

  if (!fileExisted) {
    recordMutation('created pnpm-workspace.yaml');
  }

  const warn: Warn = (message) => {
    console.warn(caution(message));
  };

  const context: SyncContext = { doc, mode, recordMutation, warn };

  removePnpmPluginSku(doc, recordMutation);
  syncSingleValueSettings(context);
  syncObjectSettings(context);
  syncArraySettings(context);

  if (modified) {
    const newContent = doc.toString();
    if (newContent !== originalContent) {
      await writeFile(filePath, newContent, 'utf-8');
    }
  }
}
