import styles from './styles.less';
import { customBox } from './styles.treat';

export default () => {
  const dynamicImport = 'used';
  import(`./dynamicImports/${dynamicImport}`).then(({ message }) => {
    const el = document.createElement('div');
    el.className = `${styles.root} ${customBox}`;
    el.innerHTML = message;
    document.body.appendChild(el);
  });
};
