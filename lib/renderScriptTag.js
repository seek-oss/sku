module.exports = src => {
  const attributes = ['type="text/javascript"', `src="${src}"`];

  if (src.startsWith('http')) {
    attributes.push('crossorigin="anonymous"');
  }

  return `<script ${attributes.join(' ')}></script>`;
};
