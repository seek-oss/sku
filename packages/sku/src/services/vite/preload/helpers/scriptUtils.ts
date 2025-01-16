export type InjectableScript = {
  src: string;
  isEntry: boolean;
  nonce: string;
};

export const createScriptTag = (injectableScript: InjectableScript) => {
  return `<script type="module" src="/${injectableScript.src}"></script>`;
};

export const sortInjectableScript = (a: InjectableScript) => {
  return a.isEntry ? 1 : -1;
};
