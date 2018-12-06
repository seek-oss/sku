module.exports = src => {
  const attributes = ['type="text/javascript"', `src="${src}"`];

  if (/^(https?:)?\/\//.test(src)) {
    attributes.push('crossorigin="anonymous"');
  }

  return `<script ${attributes.join(' ')}></script>`;
};
