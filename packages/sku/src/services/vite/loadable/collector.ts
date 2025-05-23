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
  sortInjectableScript,
} from './helpers/scriptUtils.js';
import debug from 'debug';

const log = debug('sku:loadable:collector');

export type ModuleId = string;

export class Collector {
  moduleIds = new Set<string>();
  preloadIds = new Map<string, Preload>();
  scriptIds = new Map<string, InjectableScript>();

  constructor(
    private manifest: Manifest,
    private nonce?: string,
    externalJsFiles?: string[],
    entry?: string,
    private base?: string,
  ) {
    this.manifest = manifest;
    this.nonce = nonce;

    if (externalJsFiles) {
      for (const file of externalJsFiles) {
        this.scriptIds.set(file, {
          src: file,
          isEntry: false,
          nonce,
        });
      }
    }

    parseManifestForEntry({
      manifest,
      entry: entry || 'index.html',
      preloads: this.preloadIds,
      scripts: this.scriptIds,
      nonce,
      base,
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
    const scriptHtml = [...this.scriptIds.values()]
      .sort(sortInjectableScript)
      .map(createScriptTag);
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

const parseManifestForEntry = ({
  manifest,
  entry,
  nonce,
  preloads,
  scripts,
  base,
}: {
  manifest: Manifest;
  entry: string;
  nonce?: string;
  preloads: Map<string, Preload>;
  scripts: Map<string, InjectableScript>;
  base?: string;
}) => {
  const foundChunk =
    manifest[entry] ??
    Object.values(manifest).find((chunk) => chunk.name === entry);

  if (!foundChunk) {
    return;
  }
  const entryChunk = parseEntryChunk(foundChunk, { base });

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
          base,
        });
      }
    }
  }
};

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
