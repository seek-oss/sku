import styles from './Home.less';

import React, { Fragment } from 'react';

export default props => (
  <Fragment>
    <h1 className={styles.root}>Welcome to the Home page</h1>
    <h2>{props.site}</h2>
  </Fragment>
);
