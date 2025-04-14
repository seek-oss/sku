import * as styles from './Home.css.js';

export default ({ site }) => {
  const message = `Welcome to the Home page - ${site}`;
  return <h1 className={styles.root}>{message}</h1>;
};
