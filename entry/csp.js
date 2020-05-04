import { createHash } from 'crypto';
import { parse } from 'node-html-parser';
import { URL } from 'url';

const defaultBaseName = 'http://relative-url';

const hashScriptContents = (scriptContents) =>
  createHash('sha256').update(scriptContents).digest('base64');

export default function createCSPHandler({ extraHosts = [] } = {}) {
  const hosts = new Set();
  const shas = new Set();

  const addScriptContents = (contents) => {
    shas.add(hashScriptContents(contents));
  };

  const addScriptUrl = (src) => {
    const { origin } = new URL(src, defaultBaseName);

    if (origin !== defaultBaseName) {
      hosts.add(origin);
    }
  };

  extraHosts.forEach((host) => addScriptUrl(host));

  const processScriptNode = (scriptNode) => {
    const src = scriptNode.getAttribute('src');

    if (src) {
      addScriptUrl(src);
    } else if (scriptNode.getAttribute('type') !== 'application/json') {
      addScriptContents(scriptNode.firstChild.rawText);
    }
  };

  const registerScript = (script) => {
    const root = parse(script, { script: true });

    root.querySelectorAll('script').forEach(processScriptNode);
  };

  const createCSPTag = () => {
    const policies = [];

    const inlineCspShas = [];

    for (const sha of shas.values()) {
      inlineCspShas.push(`'sha256-${sha}'`);
    }

    const scriptSrcPolicy = [
      `'self'`,
      ...hosts.values(),
      ...inlineCspShas,
    ].join(' ');

    policies.push(`script-src ${scriptSrcPolicy};`);

    return [
      `<meta http-equiv="Content-Security-Policy" content="`,
      policies.join(' '),
      '">',
    ].join('');
  };

  const handleHtml = (html) => {
    const root = parse(html, { script: true });

    if (!root.valid) {
      throw new Error('Invalid HTML');
    }

    root.querySelectorAll('script').forEach(processScriptNode);

    root.querySelector('head').insertAdjacentHTML('afterbegin', createCSPTag());

    return root.toString();
  };

  return {
    registerScript,
    createCSPTag,
    handleHtml,
  };
}
