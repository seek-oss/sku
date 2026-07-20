import { createHash, randomBytes, type BinaryLike } from 'node:crypto';
import { parse, valid, type HTMLElement } from 'node-html-parser';
import { URL } from 'node:url';
import type { RenderCallbackParams } from '../../../types/types.js';

const scriptTypeIgnoreList = ['application/json', 'application/ld+json'];

const defaultBaseName = 'http://relative-url';

const hashScriptContents = (scriptContents: BinaryLike) =>
  createHash('sha256').update(scriptContents).digest('base64');

interface CreateCSPHandlerOptions {
  extraHosts?: string[];
  reportOnlyExtraHosts?: string[];
  isDevelopment?: boolean;
}

export type CSPHandler = {
  registerScript: (script: string) => void;
  createCSP: () => string;
  createCSPTag: () => string;
  createReportOnlyCSP: () => string;
  createUnsafeNonce: () => string;
  processHtml: (html: string) => HTMLElement;
  updateHtml: (root: HTMLElement) => string;
  handleHtml: (html: string) => string;
};

export default function createCSPHandler({
  extraHosts = [],
  reportOnlyExtraHosts = [],
  isDevelopment = false,
}: CreateCSPHandlerOptions = {}): CSPHandler {
  let cspCreated = false;
  const hosts = new Set<string>();
  const reportOnlyHosts = new Set<string>();
  const shas = new Set<string>();
  const nonces = new Set<string>();

  const addScriptContents = (contents: BinaryLike | undefined) => {
    if (contents) {
      shas.add(hashScriptContents(contents));
    }
  };

  const createUnsafeNonce = () => {
    if (cspCreated) {
      throw new Error(
        `Unable to add nonce. Content Security Policy already sent. Try adding nonces before calling flushHeadTags.`,
      );
    }

    const nonce = process.env.SKU_CSP_NONCE ?? randomBytes(16).toString('hex');
    nonces.add(nonce);
    return nonce;
  };

  const addScriptUrl = (src: string) => {
    const { origin } = new URL(src, defaultBaseName);

    if (origin !== defaultBaseName) {
      hosts.add(origin);
    }
  };

  const addReportOnlyScriptUrl = (src: string) => {
    const { origin } = new URL(src, defaultBaseName);

    if (origin !== defaultBaseName) {
      reportOnlyHosts.add(origin);
    }
  };

  extraHosts.forEach((host) => addScriptUrl(host));
  reportOnlyExtraHosts.forEach((host) => addReportOnlyScriptUrl(host));

  const processScriptNode = (scriptNode: HTMLElement) => {
    const src = scriptNode.getAttribute('src');

    if (src) {
      addScriptUrl(src);
      addReportOnlyScriptUrl(src);
      return;
    }

    const scriptType = scriptNode.getAttribute('type');
    if (scriptType == null || !scriptTypeIgnoreList.includes(scriptType)) {
      addScriptContents(scriptNode.firstChild?.rawText);
    }
  };

  const registerScript: RenderCallbackParams['registerScript'] = (script) => {
    if (cspCreated) {
      throw new Error(
        `Unable to register script. Content Security Policy already sent. Try registering scripts before calling flushHeadTags. Script: ${script.substr(
          0,
          30,
        )}`,
      );
    }

    if (process.env.NODE_ENV !== 'production' && !valid(script)) {
      console.error(`Invalid script passed to 'registerScript'\n${script}`);
    }

    parse(script).querySelectorAll('script').forEach(processScriptNode);
  };

  const createCSPForHosts = (set: Set<string>) => {
    cspCreated = true;

    const inlineCspShas = [];

    for (const sha of shas.values()) {
      inlineCspShas.push(`'sha256-${sha}'`);
    }

    const inlineCspNonces = [];

    for (const nonce of nonces.values()) {
      inlineCspNonces.push(`'nonce-${nonce}'`);
    }

    const scriptSrcPolicy = [
      'script-src',
      `'self'`,
      ...set.values(),
      ...inlineCspShas,
      ...inlineCspNonces,
    ];

    if (isDevelopment) {
      scriptSrcPolicy.push(`'unsafe-eval'`);
    }

    return `${scriptSrcPolicy.join(' ')};`;
  };

  const createCSP = () => createCSPForHosts(hosts);

  const createCSPTag = () =>
    `<meta http-equiv="Content-Security-Policy" content="${createCSP()}">`;

  const createReportOnlyCSP = () => createCSPForHosts(reportOnlyHosts);

  const processHtml = (html: string) => {
    const root = parse(html, {
      comment: true,
    });

    if (!root) {
      throw new Error(
        `Unable to parse HTML in order to create CSP. Check the following output of renderDocument for invalid HTML.\n${
          html.length > 250 ? `${html.substring(0, 200)}...` : html
        }`,
      );
    }

    root.querySelectorAll('script').forEach(processScriptNode);

    return root;
  };

  const updateHtml = (root: HTMLElement) => {
    const headElement = root.querySelector('head');
    if (!headElement) {
      const html = root.toString();

      throw new Error(
        `Unable to find 'head' element in HTML in order to create CSP tag. Check the following output of renderDocument for invalid HTML.\n${
          html.length > 250 ? `${html.substring(0, 200)}...` : html
        }`,
      );
    }

    headElement.insertAdjacentHTML('afterbegin', createCSPTag());

    return root.toString();
  };

  const handleHtml = (html: string) => updateHtml(processHtml(html));

  return {
    registerScript,
    createCSP,
    createCSPTag,
    createReportOnlyCSP,
    createUnsafeNonce,
    processHtml,
    updateHtml,
    handleHtml,
  };
}
