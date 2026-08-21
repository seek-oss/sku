export type InjectableScript = {
  src: string;
  isEntry: boolean;
  nonce?: string;
  isChunk?: boolean;
};

export const createScriptTag = ({ nonce, src, isChunk }: InjectableScript) =>
  `<script type="module" src="${src}"${isChunk ? ' data-chunk' : ''}${nonce ? ` nonce="${nonce}"` : ''}></script>`;

export const sortInjectableScript = (a: InjectableScript) =>
  a.isEntry ? 1 : -1;
