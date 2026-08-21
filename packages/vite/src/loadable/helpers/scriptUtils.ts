export type InjectableScript = {
  src: string;
  nonce?: string;
  isRequiredChunk?: boolean;
};

export const createScriptTag = ({
  nonce,
  src,
  isRequiredChunk,
}: InjectableScript) => {
  const attributes = [
    `type="module"`,
    isRequiredChunk ? 'async data-required-chunk' : null,
    `src="${src}"`,
    nonce ? `nonce="${nonce}"` : null,
  ]
    .filter(Boolean)
    .join(' ');

  return `<script ${attributes}></script>`;
};
