import * as styles from './styles.css.js';

export default () => {
  const dynamicImport = 'used';
  import(`./dynamicImports/${dynamicImport}`).then(({ message }) => {
    const el = document.createElement('div');
    el.className = `${styles.root}`;
    el.innerHTML = message;
    document.body.appendChild(el);
  });
};
