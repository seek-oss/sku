import { createHash } from 'crypto';
import { parse } from 'node-html-parser';
import { URL } from 'url';

const scriptTypeIgnoreList = ['application/json', 'application/ld+json'];

const defaultBaseName = 'http://relative-url';

const hashScriptContents = (scriptContents) =>
  createHash('sha256').update(scriptContents).digest('base64');

export default function createCSPHandler({ extraHosts = [] } = {}) {
  let tagReturned = false;
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
    } else if (
      !scriptTypeIgnoreList.includes(scriptNode.getAttribute('type'))
    ) {
      addScriptContents(scriptNode.firstChild.rawText);
    }
  };

  const registerScript = (script) => {
    if (tagReturned) {
      throw new Error(
        `Unable to register script. Content Security Policy already sent. Try registering scripts before calling flushHeadTags. Script: ${script.substr(
          0,
          30,
        )}`,
      );
    }

    const root = parse(script, { script: true });

    if (!root.valid) {
      console.error(`Invalid script passed to 'registerScript'\n${script}`);
    }

    root.querySelectorAll('script').forEach(processScriptNode);
  };

  const createCSPTag = () => {
    tagReturned = true;

    const inlineCspShas = [];

    for (const sha of shas.values()) {
      inlineCspShas.push(`'sha256-${sha}'`);
    }

    const scriptSrcPolicy = [
      'script-src',
      `'self'`,
      ...hosts.values(),
      ...inlineCspShas,
    ].join(' ');

    return `<meta http-equiv="Content-Security-Policy" content="${scriptSrcPolicy};">`;
  };

  const handleHtml = (html) => {
    const root = parse(html, {
      script: true,
      style: true,
      pre: true,
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

    root.querySelector('head').insertAdjacentHTML('afterbegin', createCSPTag());

    return root.toString();
  };

  return {
    registerScript,
    createCSPTag,
    handleHtml,
  };
}
