import styles from './client.less';

const fileName = 'message';

import(`./message/${fileName}`).then(({ message }) => {
  document.getElementById('app').innerHTML = message;
  document.getElementById('app').className = styles.root;
});
