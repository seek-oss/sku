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

export type ModuleId = string;

// TODO: improve log levels for this class.
export class Collector {
  moduleIds = new Set<string>();
  preloadIds = new Map<string, Preload>();
  scriptIds = new Map<string, InjectableScript>();

  constructor(
    private manifest: Manifest,
    private nonce?: string,
    private externalJsFiles?: string[],
    private entry?: string,
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
  private getAllModules() {
    return [...this.moduleIds];
  }
  private getAllPreloads() {
    const preloadHtml = [...this.preloadIds.values()]
      .sort(sortPreloads)
      .map(createHtmlTag)
      .join('\n');

    return preloadHtml;
  }
  private getAllScripts() {
    const scriptHtml = [...this.scriptIds.values()]
      .sort(sortInjectableScript)
      .map(createScriptTag)
      .join('\n');

    return scriptHtml;
  }
  private getAllLinks() {
    const linkTags = [...this.preloadIds.values()]
      .sort(sortPreloads)
      .map(createLinkTag)
      .filter(Boolean);

    return linkTags;
  }
  public getHeadTags() {
    // TODO: Likely needs to call some of the above methods.
    console.error('Not Implemented: Returning no head tags.');
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
  if (!manifest) {
    return;
  }
  const entryChunk: ManifestChunk | undefined =
    manifest[entry] && parseEntryChunk(manifest[entry], { base });
  if (!entryChunk) {
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
