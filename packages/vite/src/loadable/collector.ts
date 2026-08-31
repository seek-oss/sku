import type { Manifest, ManifestChunk } from 'vite';
import { extname } from 'node:path';
import {
  type Preload,
  sortPreloads,
  createHtmlTag,
  createLinkTag,
} from './helpers/preloadUtils.js';
import {
  createScriptTag,
  type InjectableScript,
} from './helpers/scriptUtils.js';
import { createDebug } from 'obug';

const log = createDebug('sku:loadable:collector');

export type ModuleId = string;

export class Collector {
  moduleIds = new Set<string>();
  preloadIds = new Map<string, Preload>();
  scriptIds = new Map<string, InjectableScript>();
  private clientEntryFile: string | undefined;

  constructor(
    private manifest: Manifest,
    private nonce?: string,
    externalJsFiles?: string[],
    entry?: string,
    private base?: string,
  ) {
    this.manifest = manifest;
    this.nonce = nonce;

    const entryPoint = entry || 'index.html';
    this.clientEntryFile = resolveChunkFile({
      manifest,
      entry: entryPoint,
      base,
    });

    if (externalJsFiles) {
      for (const file of externalJsFiles) {
        this.scriptIds.set(file, {
          src: file,
          nonce,
        });
      }
    }

    parseManifestForEntry({
      manifest,
      entry: entryPoint,
      preloads: this.preloadIds,
      scripts: this.scriptIds,
      nonce,
      base,
      clientEntryFile: this.clientEntryFile,
    });
  }

  public register(moduleId: ModuleId) {
    this.moduleIds.add(moduleId);
    parseManifestForEntry({
      manifest: this.manifest,
      entry: moduleId,
      preloads: this.preloadIds,
      scripts: this.scriptIds,
      nonce: this.nonce,
      base: this.base,
      clientEntryFile: this.clientEntryFile,
      markAsRequiredChunk: true,
    });
  }
  public getAllPreloads() {
    const preloadHtml = [...this.preloadIds.values()]
      .sort(sortPreloads)
      .map(createHtmlTag);
    log('getAllPreloads', preloadHtml);

    return preloadHtml;
  }
  public getAllScripts() {
    const scriptHtml = [...this.scriptIds.values()].map(createScriptTag);
    log('getAllScripts', scriptHtml);
    return scriptHtml;
  }
  public getAllLinks() {
    const linkTags = [...this.preloadIds.values()]
      .sort(sortPreloads)
      .map(createLinkTag)
      .filter(Boolean);
    log('getAllLinks', linkTags);

    return linkTags;
  }
}

const findManifestChunk = (manifest: Manifest, entry: string) =>
  manifest[entry] ??
  Object.values(manifest).find((chunk) => chunk.name === entry);

const parseEntryChunk = (
  entryChunk: ManifestChunk,
  { base = '/' }: { base?: string },
) => ({
  ...entryChunk,
  // Overriding the path urls to include the base path.
  css: entryChunk.css?.map((path) => `${base}${path}`),
  assets: entryChunk.assets?.map((path) => `${base}${path}`),
  file: `${base}${entryChunk.file}`,
});

const resolveChunkFile = ({
  manifest,
  entry,
  base,
}: {
  manifest: Manifest;
  entry: string;
  base?: string;
}) => {
  const foundChunk = findManifestChunk(manifest, entry);

  return foundChunk ? parseEntryChunk(foundChunk, { base }).file : undefined;
};

const parseManifestForEntry = ({
  manifest,
  entry,
  nonce,
  preloads,
  scripts,
  base,
  clientEntryFile,
  seenChunks = new Set<string>(),
  markAsRequiredChunk = false,
}: {
  manifest: Manifest;
  entry: string;
  nonce?: string;
  preloads: Map<string, Preload>;
  scripts: Map<string, InjectableScript>;
  base?: string;
  clientEntryFile?: string;
  seenChunks?: Set<string>;
  markAsRequiredChunk?: boolean;
}) => {
  const foundChunk = findManifestChunk(manifest, entry);

  if (!foundChunk) {
    return;
  }

  // Guard against revisiting a chunk (and against cycles in the import graph).
  // We key on the output file name, mirroring Vite's `getCssFilesForChunk`
  // `seenChunks` set, since `entry` can be either a manifest key or a chunk
  // name resolving to the same chunk.
  if (seenChunks.has(foundChunk.file)) {
    return;
  }
  seenChunks.add(foundChunk.file);

  const entryChunk = parseEntryChunk(foundChunk, { base });

  // Recurse into imports BEFORE registering this chunk's own CSS/assets so that
  // dependency CSS is emitted first. This matches the post-order DFS Vite uses
  // in `getCssFilesForChunk`, ensuring the cascade order is correct (e.g. a
  // reset stylesheet in a dependency loads before the importing chunk's atoms).
  if (entryChunk.imports) {
    for (const chunk of entryChunk.imports) {
      parseManifestForEntry({
        manifest,
        entry: chunk,
        nonce,
        preloads,
        scripts,
        base,
        clientEntryFile,
        seenChunks,
      });
    }
  }

  if (entryChunk.css) {
    for (const chunk of entryChunk.css) {
      addStylesheetToPreloads({ preloads, chunk, nonce });
    }
  }
  if (entryChunk.assets) {
    for (const chunk of entryChunk.assets) {
      addAssetToPreloads({ preloads, chunk, nonce });
    }
  }

  addFileToPreloads({ preloads, entry, entryChunk, nonce });

  const isClientEntry = Boolean(
    clientEntryFile && entryChunk.file === clientEntryFile,
  );
  const existing = scripts.get(entry);

  scripts.set(entry, {
    src: entryChunk.file,
    nonce,
    // Tag register() roots, including standalone Vite-entry chunks. Never tag
    // the client-entry file (awaiting it deadlocks hydration). Do not use Vite
    // `isEntry` as the exclusion.
    isRequiredChunk: Boolean(
      (markAsRequiredChunk || existing?.isRequiredChunk) && !isClientEntry,
    ),
  });
};

const addFileToPreloads = ({
  preloads,
  entryChunk,
  entry,
  nonce,
}: {
  preloads: Map<string, Preload>;
  entryChunk: ManifestChunk;
  entry: string;
  nonce?: string;
}) => {
  preloads.set(entry, {
    rel: 'modulepreload',
    href: entryChunk.file,
    nonce,
  });
};

const addStylesheetToPreloads = ({
  preloads,
  chunk,
  nonce,
}: {
  preloads: Map<string, Preload>;
  chunk: string;
  nonce?: string;
}) => {
  preloads.set(chunk, {
    rel: 'stylesheet',
    href: chunk,
    type: 'text/css', // important for link.
    nonce,
  });
};

const addAssetToPreloads = ({
  preloads,
  chunk,
  nonce,
}: {
  preloads: Map<string, Preload>;
  chunk: string;
  nonce?: string;
}) => {
  const ext = extname(chunk).substring(1);
  let as;
  let mimeType;

  switch (ext) {
    case 'avif':
    case 'bmp':
    case 'gif':
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'svg':
    case 'webp':
      as = 'image';
      mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
      break;
    case 'ttf':
    case 'woff2':
    case 'woff':
      as = 'font';
      mimeType = `font/${ext}`;
      break;
  }

  preloads.set(chunk, {
    rel: 'preload',
    href: chunk,
    nonce,
    as,
    type: mimeType,
  });
};

type CreateCollectorOptions = {
  externalJsFiles?: string[];
  manifest?: Manifest;
  nonce?: string;
  entry?: string;
  base?: string;
};

export const createCollector = ({
  externalJsFiles,
  manifest,
  nonce,
  entry,
  base,
}: CreateCollectorOptions) => {
  let entryPoint = entry || 'index.html';
  const internalManifest = manifest || {};
  if (!internalManifest[entryPoint]) {
    const entryChunk = Object.entries(internalManifest).find(
      ([_, { name }]) => name === 'vite-client',
    );
    if (entryChunk) {
      entryPoint = entryChunk[0];
    }
  }

  return new Collector(
    internalManifest,
    nonce,
    externalJsFiles,
    entryPoint,
    base,
  );
};
