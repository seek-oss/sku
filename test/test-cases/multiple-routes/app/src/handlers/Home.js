import React from 'react';
import styles from './Home.less';

export default (props) => {
  const message = `Welcome to the Home page - ${props.site}`;
  return <h1 className={styles.root}>{message}</h1>;
};
