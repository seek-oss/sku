import { createHash, randomBytes, type BinaryLike } from 'node:crypto';
import { parse, valid, type HTMLElement } from 'node-html-parser';
import { URL } from 'node:url';
import type { RenderCallbackParams } from '../../../types/types.js';

const scriptTypeIgnoreList = ['application/json', 'application/ld+json'];

const defaultBaseName = 'http://relative-url';

const hashScriptContents = (scriptContents: BinaryLike) =>
  createHash('sha256').update(scriptContents).digest('base64');

interface CreateCSPHandlerOptions {
  enabled?: boolean;
  extraHosts?: string[];
  isDevelopment?: boolean;
}

export type CSPHandler = {
  registerScript: (script: string) => void;
  createCSPTag: () => string;
  createUnsafeNonce: () => string;
  handleHtml: (html: string) => string;
};

export default function createCSPHandler({
  enabled = true,
  extraHosts = [],
  isDevelopment = false,
}: CreateCSPHandlerOptions = {}): CSPHandler {
  let tagReturned = false;
  const hosts = new Set();
  const shas = new Set();
  const nonces = new Set();

  const addScriptContents = (contents: BinaryLike | undefined) => {
    if (contents) {
      shas.add(hashScriptContents(contents));
    }
  };

  const createUnsafeNonce = () => {
    if (tagReturned) {
      throw new Error(
        `Unable to add nonce. Content Security Policy already sent. Try adding nonces before calling flushHeadTags.`,
      );
    }
    if (!enabled) {
      throw new Error(
        `Unable to add nonce. Content Security Policy is disabled. Enable with cspEnabled option. https://seek-oss.github.io/sku/#/./docs/configuration?id=cspenabled`,
      );
    }

    const nonce = randomBytes(16).toString('hex');
    nonces.add(nonce);
    return nonce;
  };

  const addScriptUrl = (src: string) => {
    const { origin } = new URL(src, defaultBaseName);

    if (origin !== defaultBaseName) {
      hosts.add(origin);
    }
  };

  extraHosts.forEach((host) => addScriptUrl(host));

  const processScriptNode = (scriptNode: HTMLElement) => {
    const src = scriptNode.getAttribute('src');

    if (src) {
      addScriptUrl(src);
      return;
    }

    const scriptType = scriptNode.getAttribute('type');
    if (scriptType == null || !scriptTypeIgnoreList.includes(scriptType)) {
      addScriptContents(scriptNode.firstChild?.rawText);
    }
  };

  const registerScript: RenderCallbackParams['registerScript'] = (script) => {
    if (tagReturned) {
      throw new Error(
        `Unable to register script. Content Security Policy already sent. Try registering scripts before calling flushHeadTags. Script: ${script.substr(
          0,
          30,
        )}`,
      );
    }
    if (!enabled) {
      throw new Error(
        `Unable to register script. Content Security Policy is disabled. Enable with cspEnabled option. https://seek-oss.github.io/sku/#/./docs/configuration?id=cspenabled`,
      );
    }

    if (process.env.NODE_ENV !== 'production' && !valid(script)) {
      console.error(`Invalid script passed to 'registerScript'\n${script}`);
    }

    parse(script).querySelectorAll('script').forEach(processScriptNode);
  };

  const createCSPTag = () => {
    tagReturned = true;

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
      ...hosts.values(),
      ...inlineCspShas,
      ...inlineCspNonces,
    ];

    if (isDevelopment) {
      scriptSrcPolicy.push(`'unsafe-eval'`);
    }

    return `<meta http-equiv="Content-Security-Policy" content="${scriptSrcPolicy.join(
      ' ',
    )};">`;
  };

  const handleHtml = (html: string) => {
    const root = parse(html, {
      comment: true,
    });

    if (!root) {
      throw new Error(
        `Unable to parse HTML in order to create CSP tag. Check the following output of renderDocument for invalid HTML.\n${
          html.length > 250 ? `${html.substring(0, 200)}...` : html
        }`,
      );
    }

    root.querySelectorAll('script').forEach(processScriptNode);

    const headElement = root.querySelector('head');
    if (!headElement) {
      throw new Error(
        `Unable to find 'head' element in HTML in order to create CSP tag. Check the following output of renderDocument for invalid HTML.\n${
          html.length > 250 ? `${html.substring(0, 200)}...` : html
        }`,
      );
    }

    headElement.insertAdjacentHTML('afterbegin', createCSPTag());

    return root.toString();
  };

  return {
    registerScript,
    createCSPTag,
    createUnsafeNonce,
    handleHtml,
  };
}
