export type InjectableScript = {
  src: string;
  isEntry: boolean;
  nonce?: string;
};

export const createScriptTag = (injectableScript: InjectableScript) =>
  `<script type="module" src="/${injectableScript.src}" ${injectableScript.nonce ? `nonce="${injectableScript.nonce}"` : ''}></script>`;

export const sortInjectableScript = (a: InjectableScript) =>
  a.isEntry ? 1 : -1;
