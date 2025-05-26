export type Preload = {
  rel: 'stylesheet' | 'modulepreload' | 'module' | 'preload';
  href: string;
  // preload as
  as?: string;
  // mime type for link preload
  type?: string;
  nonce?: string;
  isEntry?: boolean;
  asyncScript?: boolean;
};

const getNonce = (nonce?: string) => (nonce ? ` nonce="${nonce}"` : '');

const tagTypes = {
  stylesheet: ({ href, nonce }: Preload) =>
    `<link rel="stylesheet" href="${href}" crossorigin${getNonce(nonce)} />`,
  modulepreload: ({ href, nonce }: Preload) =>
    `<link rel="modulepreload" href="${href}" crossorigin${getNonce(nonce)} />`,
  module: ({ href, asyncScript, nonce }: Preload) =>
    `<script type="module"${asyncScript ? ' async' : ''} src="${href}" crossorigin${getNonce(nonce)}></script>`,
  preload: ({ as, href, type }: Preload) => {
    const crossorigin = as === 'font' || as === 'fetch';
    return `<link rel="preload" href="${href}" as="${as}" type="${type}"${crossorigin ? ' crossorigin' : ''} />`;
  },
};

// Make this my style still
const linkPriority = (module: Preload) => {
  switch (module.rel) {
    // Stylesheets have the 'Highest' priority in Chrome
    case 'stylesheet':
      return 10;
    // <script> and <link rel=modulepreload> have the 'High' priority
    case 'module':
      // Always load blocking scripts before the async script.
      // This is because if your entry script is async, your polyfill module which is not async will need to be executed first.
      return module.asyncScript ? 4 : 5;
    case 'modulepreload':
      return 2;
    case 'preload':
      // Load fonts just below stylesheets. If we don't, there is a higher risk of that the text will flash on the site
      if (module.as === 'font') {
        return 9;
      }
      return 0;
    default:
      return -1;
  }
};

const moduleLink = ({ href }: Preload) =>
  `</${href}>; rel=modulepreload; crossorigin`;

const linkTypes = {
  stylesheet: ({ href }: Preload) =>
    `</${href}>; rel=preload; as=style; crossorigin`,
  module: moduleLink,
  modulepreload: moduleLink,
  preload: ({ href, as, type }: Preload) => {
    const crossorigin = as === 'font' || as === 'fetch';
    return `</${href}>; rel=preload; as=${as}; type=${type}${crossorigin ? '; crossorigin' : ''}`;
  },
};

export const createLinkTag = (preload: Preload) =>
  linkTypes[preload.rel](preload);

export const createHtmlTag = (preload: Preload) =>
  `${tagTypes[preload.rel](preload)}\n`;

export const sortPreloads = (a: Preload, b: Preload) =>
  linkPriority(b) - linkPriority(a);
