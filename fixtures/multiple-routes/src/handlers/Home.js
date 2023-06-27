import styles from './Home.less';

export default ({ site }) => {
  const message = `Welcome to the Home page - ${site}`;
  return <h1 className={styles.root}>{message}</h1>;
};
