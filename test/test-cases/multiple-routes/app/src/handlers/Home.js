import styles from './Home.less';

import React from 'react';

export default (props) => {
  const message = `Welcome to the Home page - ${props.site}`;
  return <h1 className={styles.root}>{message}</h1>;
};
