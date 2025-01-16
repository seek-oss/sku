import type { Manifest } from 'vite';
import { extname } from 'path';
import {
  type Preload,
  sortPreloads,
  createHtmlTag,
  createLinkTag,
} from './helpers/preloadUtils.js';
import {
  createScriptTag,
  type InjectableScript,
  sortInjectableScript,
} from './helpers/scriptUtils.js';

export type ModuleId = string;

export class Collector {
  moduleIds = new Set<string>();
  preloadIds = new Map<string, Preload>();
  scriptIds = new Map<string, InjectableScript>();

  constructor(
    public manifest: Manifest,
    public nonce: string,
    public externalJsFiles: string[],
  ) {
    this.manifest = manifest;
    this.nonce = nonce;

    for (const file of externalJsFiles) {
      this.scriptIds.set(file, {
        src: file,
        isEntry: false,
        nonce,
      });
    }

    parseManifestForEntry({
      manifest,
      entry: 'index.html',
      preloads: this.preloadIds,
      scripts: this.scriptIds,
      nonce,
    });
  }

  register(moduleId: ModuleId) {
    this.moduleIds.add(moduleId);
    parseManifestForEntry({
      manifest: this.manifest,
      entry: moduleId,
      preloads: this.preloadIds,
      scripts: this.scriptIds,
      nonce: this.nonce,
    });
  }
  getAllModules() {
    return [...this.moduleIds];
  }
  getAllPreloads() {
    const preloadHtml = [...this.preloadIds.values()]
      .sort(sortPreloads)
      .map(createHtmlTag)
      .join('\n');

    return preloadHtml;
  }
  getAllScripts() {
    const scriptHtml = [...this.scriptIds.values()]
      .sort(sortInjectableScript)
      .map(createScriptTag)
      .join('\n');

    return scriptHtml;
  }
  getAllLinks() {
    const linkTags = [...this.preloadIds.values()]
      .sort(sortPreloads)
      .map(createLinkTag)
      .filter(Boolean)
      .join('\n');

    return linkTags;
  }
}

const parseManifestForEntry = ({
  manifest,
  entry,
  nonce,
  preloads,
  scripts,
}: {
  manifest: Manifest;
  entry: string;
  nonce: string;
  preloads: Map<string, Preload>;
  scripts: Map<string, InjectableScript>;
}) => {
  const entryChunk = manifest[entry];
  if (!entryChunk) {
    console.error('Entry chunk not found in manifest', entry);
    return;
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

  scripts.set(entry, {
    src: entryChunk.file,
    isEntry: Boolean(entryChunk.isEntry),
    nonce,
  });

  if (entryChunk.imports) {
    for (const chunk of entryChunk.imports) {
      if (!preloads.has(chunk)) {
        parseManifestForEntry({
          manifest,
          entry: chunk,
          nonce,
          preloads,
          scripts,
        });
      }
    }
  }
};

const addFileToPreloads = ({
  preloads,
  entryChunk,
  entry,
  nonce,
}: {
  preloads: Map<string, Preload>;
  entryChunk: any;
  entry: string;
  nonce: string;
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
  nonce: string;
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
  nonce: string;
}) => {
  const ext = extname(chunk).substring(1);
  let as;
  let mimeType;

  switch (ext) {
    case 'png':
    case 'jpg':
    case 'webp':
    case 'svg':
      as = 'image';
      mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
    case 'woff2':
    case 'woff':
    case 'ttf':
      as = 'font';
      mimeType = `font/${ext}`;
  }

  // This requires a type check for the asset type and then set the type and 'as' attribute.
  preloads.set(chunk, {
    rel: 'preload',
    href: chunk,
    nonce,
    as,
    type: mimeType,
  });
};

type CreateCollectorOptions = {
  externalJsFiles: string[];
  manifest: Manifest;
  nonce: string;
};

export const createCollector = ({
  externalJsFiles,
  manifest,
  nonce,
}: CreateCollectorOptions) => {
  // Something here to set the manifest properly.
  const internalManifest = manifest || {};

  return new Collector(internalManifest, nonce, externalJsFiles);
};
