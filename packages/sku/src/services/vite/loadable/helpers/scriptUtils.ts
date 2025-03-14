export type InjectableScript = {
  src: string;
  isEntry: boolean;
  nonce?: string;
};

export const createScriptTag = ({ nonce, src }: InjectableScript) =>
  `<script type="module" src="${src}" ${nonce ? `nonce="${nonce}"` : ''}></script>`;

export const sortInjectableScript = (a: InjectableScript) =>
  a.isEntry ? 1 : -1;
